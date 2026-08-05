// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { StdInvariant } from "forge-std/StdInvariant.sol";
import { Test } from "forge-std/Test.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { BuybackVault } from "../src/BuybackVault.sol";
import { ZazuToken } from "../src/ZazuToken.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";
import { MockRouter } from "./mocks/MockRouter.sol";

contract BuybackVaultHandler is Test {
    BuybackVault public immutable vault;
    MockERC20 public immutable fee;
    ZazuToken public immutable zazu;
    MockRouter public immutable router;

    bool public directTransferSucceeded;
    bool public keeperAdminCallSucceeded;

    constructor(BuybackVault vault_, MockERC20 fee_, ZazuToken zazu_, MockRouter router_) {
        vault = vault_;
        fee = fee_;
        zazu = zazu_;
        router = router_;
        fee.approve(address(vault), type(uint256).max);
    }

    function deposit(uint96 rawAmount) external {
        uint256 amount = bound(uint256(rawAmount), 1, 10 ether);
        fee.mint(address(this), amount);
        vault.depositERC20(amount);
    }

    function execute(uint96 rawAmount) external {
        uint256 balance = fee.balanceOf(address(vault));
        uint256 minimum = vault.minimumExecutionAmount();
        uint256 upper =
            balance < vault.maximumExecutionAmount() ? balance : vault.maximumExecutionAmount();
        if (upper < minimum) return;

        uint256 amount = bound(uint256(rawAmount), minimum, upper);
        uint256 output = amount * 10;
        vm.warp(block.timestamp + vault.minimumInterval());
        bytes memory data = abi.encode(output, amount, address(0), false);
        try vault.executeBuyback(amount, output, data) { } catch { }
    }

    function attemptDirectTransfer(uint96 rawAmount) external {
        uint256 amount = bound(uint256(rawAmount), 1, 10 ether);
        (bool success,) = address(fee)
            .call(abi.encodeCall(IERC20.transferFrom, (address(vault), address(this), amount)));
        if (success) directTransferSucceeded = true;
    }

    function attemptOwnerAction(address destination) external {
        if (destination == address(0)) destination = address(1);
        (bool success,) =
            address(vault).call(abi.encodeCall(BuybackVault.setBuybackDestination, (destination)));
        if (success) keeperAdminCallSucceeded = true;
    }
}

contract BuybackVaultInvariantTest is StdInvariant, Test {
    address internal destination = makeAddr("burnDestination");
    address internal wrappedNative = makeAddr("wrappedNative");

    ZazuToken internal zazu;
    MockERC20 internal fee;
    MockRouter internal router;
    BuybackVault internal vault;
    BuybackVaultHandler internal handler;

    function setUp() public {
        zazu = new ZazuToken(address(this), address(this), 1_000_000_000 ether);
        fee = new MockERC20("Fee Token", "FEE");
        router = new MockRouter();
        vault = new BuybackVault(
            address(this),
            address(zazu),
            address(router),
            wrappedNative,
            address(fee),
            destination,
            address(this),
            1 ether,
            10 ether,
            500
        );
        handler = new BuybackVaultHandler(vault, fee, zazu, router);
        vault.setKeeper(address(handler));
        zazu.transfer(address(router), 900_000_000 ether);
        targetContract(address(handler));
    }

    /// @dev Every recorded spend must be backed by an accounted fee deposit.
    function invariantTotalInputSpentNeverExceedsTotalDeposited() public view {
        assertLe(vault.totalInputSpent(), vault.totalDeposited());
    }

    /// @dev With no owner rescue in the handler, deposit accounting is conserved exactly.
    function invariantTreasuryAndSpentEqualDeposits() public view {
        assertEq(fee.balanceOf(address(vault)) + vault.totalInputSpent(), vault.totalDeposited());
    }

    /// @dev The keeper has no withdrawal allowance or privileged admin path.
    function invariantKeeperCannotTransferTreasuryAssetsDirectly() public view {
        assertFalse(handler.directTransferSucceeded());
        assertFalse(handler.keeperAdminCallSucceeded());
        assertEq(fee.allowance(address(vault), address(handler)), 0);
    }
}
