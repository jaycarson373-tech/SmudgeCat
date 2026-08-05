// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Test } from "forge-std/Test.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { BuybackVault } from "../src/BuybackVault.sol";
import { ZazuToken } from "../src/ZazuToken.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";
import { MockRouter } from "./mocks/MockRouter.sol";
import { ReentrantRouter } from "./mocks/ReentrantRouter.sol";

contract BuybackVaultTest is Test {
    event FeesReceived(address indexed sender, address indexed asset, uint256 amount);
    event BuybackExecuted(
        uint256 indexed executionId,
        address indexed inputAsset,
        uint256 amountIn,
        uint256 zazuReceived,
        address indexed destination,
        uint256 timestamp
    );
    event KeeperUpdated(address oldKeeper, address newKeeper);
    event RouterUpdated(address oldRouter, address newRouter);
    event DestinationUpdated(address oldDestination, address newDestination);

    address internal owner = makeAddr("owner");
    address internal keeper = makeAddr("keeper");
    address internal depositor = makeAddr("depositor");
    address internal destination = makeAddr("burnDestination");
    address internal wrappedNative = makeAddr("wrappedNative");

    uint256 internal constant MIN_AMOUNT = 1 ether;
    uint256 internal constant MAX_AMOUNT = 10 ether;
    uint256 internal constant SLIPPAGE_BPS = 500;

    ZazuToken internal zazu;
    MockERC20 internal fee;
    MockRouter internal router;
    BuybackVault internal vault;

    function setUp() public {
        vm.warp(30 days);
        zazu = new ZazuToken(owner, owner, 1_000_000_000 ether);
        fee = new MockERC20("Fee Token", "FEE");
        router = new MockRouter();
        vault = _newErc20Vault(address(router), keeper);

        vm.prank(owner);
        zazu.transfer(address(router), 100_000_000 ether);
        fee.mint(depositor, 1000 ether);
        vm.prank(depositor);
        fee.approve(address(vault), type(uint256).max);
        vm.warp(block.timestamp + vault.minimumInterval());
    }

    function testERC20FeeDepositUsesActualBalanceAndEmitsEvent() public {
        vm.expectEmit(true, true, false, true, address(vault));
        emit FeesReceived(depositor, address(fee), 5 ether);
        vm.prank(depositor);
        vault.depositERC20(5 ether);

        assertEq(fee.balanceOf(address(vault)), 5 ether);
        assertEq(vault.totalDeposited(), 5 ether);
    }

    function testDirectERC20FeeTransferIsAccountedBeforeExecution() public {
        vm.prank(depositor);
        fee.transfer(address(vault), 5 ether);
        assertEq(vault.totalDeposited(), 0);

        vm.expectEmit(true, true, false, true, address(vault));
        emit FeesReceived(address(0), address(fee), 5 ether);
        vm.prank(keeper);
        vault.executeBuyback(5 ether, 1, _erc20SwapData(5 ether, 100 ether, address(vault)));

        assertEq(vault.totalDeposited(), 5 ether);
        assertEq(vault.totalInputSpent(), 5 ether);
    }

    function testNativeFeeDeposit() public {
        BuybackVault nativeVault = _newNativeVault(address(router), keeper);
        vm.deal(depositor, 5 ether);

        vm.expectEmit(true, true, false, true, address(nativeVault));
        emit FeesReceived(depositor, address(0), 5 ether);
        vm.prank(depositor);
        (bool success,) = address(nativeVault).call{ value: 5 ether }("");

        assertTrue(success);
        assertEq(address(nativeVault).balance, 5 ether);
        assertEq(nativeVault.totalDeposited(), 5 ether);
    }

    function testSuccessfulERC20BuybackAndEventCorrectness() public {
        _deposit(5 ether);
        bytes memory data = _erc20SwapData(5 ether, 1000 ether, address(vault));

        vm.expectEmit(true, true, true, true, address(vault));
        emit BuybackExecuted(1, address(fee), 5 ether, 1000 ether, destination, block.timestamp);
        vm.prank(keeper);
        vault.executeBuyback(5 ether, 950 ether, data);

        assertEq(zazu.balanceOf(destination), 1000 ether);
        assertEq(vault.executionCount(), 1);
        assertEq(vault.totalInputSpent(), 5 ether);
        assertEq(vault.totalZazuBought(), 1000 ether);
        assertEq(vault.lastExecutionTime(), block.timestamp);
        assertEq(fee.allowance(address(vault), address(router)), 0);
        assertEq(router.lastInputToken(), address(fee));
        assertEq(router.lastOutputToken(), address(zazu));
        assertEq(router.lastAmountIn(), 5 ether);
        assertEq(router.lastMinimumAmountOut(), 950 ether);
        assertEq(router.lastRecipient(), address(vault));
    }

    function testSuccessfulNativeBuyback() public {
        BuybackVault nativeVault = _newNativeVault(address(router), keeper);
        vm.prank(owner);
        zazu.transfer(address(router), 2000 ether);
        vm.deal(depositor, 5 ether);
        vm.prank(depositor);
        (bool deposited,) = address(nativeVault).call{ value: 5 ether }("");
        assertTrue(deposited);
        vm.warp(block.timestamp + nativeVault.minimumInterval());

        bytes memory data = _routeData(1000 ether, 5 ether, address(0), false);
        vm.prank(keeper);
        nativeVault.executeBuyback(5 ether, 950 ether, data);

        assertEq(zazu.balanceOf(destination), 1000 ether);
        assertEq(address(nativeVault).balance, 0);
        assertEq(nativeVault.totalInputSpent(), 5 ether);
    }

    function testRejectsSecondBuybackBeforeFifteenMinutes() public {
        _deposit(10 ether);
        vm.prank(keeper);
        vault.executeBuyback(5 ether, 1, _erc20SwapData(5 ether, 100 ether, address(vault)));

        uint256 expectedNext = block.timestamp + 15 minutes;
        vm.prank(keeper);
        vm.expectRevert(
            abi.encodeWithSelector(BuybackVault.IntervalNotElapsed.selector, expectedNext)
        );
        vault.executeBuyback(5 ether, 1, _erc20SwapData(5 ether, 100 ether, address(vault)));

        vm.warp(expectedNext);
        vm.prank(keeper);
        vault.executeBuyback(5 ether, 1, _erc20SwapData(5 ether, 100 ether, address(vault)));
        assertEq(vault.executionCount(), 2);
    }

    function testNewVaultRejectsExecutionUntilFirstFifteenMinuteWindow() public {
        BuybackVault freshVault = _newErc20Vault(address(router), keeper);
        vm.prank(depositor);
        fee.approve(address(freshVault), type(uint256).max);
        vm.prank(depositor);
        freshVault.depositERC20(5 ether);

        uint256 expectedNext = block.timestamp + freshVault.minimumInterval();
        vm.prank(keeper);
        vm.expectRevert(
            abi.encodeWithSelector(BuybackVault.IntervalNotElapsed.selector, expectedNext)
        );
        freshVault.executeBuyback(5 ether, 1, _routeData(100 ether, 5 ether, address(0), false));

        vm.warp(expectedNext);
        vm.prank(keeper);
        freshVault.executeBuyback(5 ether, 1, _routeData(100 ether, 5 ether, address(0), false));
        assertEq(freshVault.executionCount(), 1);
    }

    function testRejectsBelowMinimumAmount() public {
        _deposit(5 ether);
        vm.prank(keeper);
        vm.expectRevert(BuybackVault.InvalidAmount.selector);
        vault.executeBuyback(MIN_AMOUNT - 1, 1, hex"12345678");
    }

    function testRejectsAboveMaximumAmount() public {
        _deposit(11 ether);
        vm.prank(keeper);
        vm.expectRevert(BuybackVault.InvalidAmount.selector);
        vault.executeBuyback(MAX_AMOUNT + 1, 1, hex"12345678");
    }

    function testRejectsUnauthorizedCaller() public {
        _deposit(5 ether);
        vm.prank(depositor);
        vm.expectRevert(abi.encodeWithSelector(BuybackVault.UnauthorizedKeeper.selector, depositor));
        vault.executeBuyback(5 ether, 1, hex"12345678");
    }

    function testSlippageFailureRevertsEntireSwap() public {
        _deposit(5 ether);
        uint256 treasuryBefore = fee.balanceOf(address(vault));
        vm.prank(keeper);
        vm.expectRevert(
            abi.encodeWithSelector(
                BuybackVault.InsufficientZazuReceived.selector, 99 ether, 100 ether
            )
        );
        vault.executeBuyback(5 ether, 100 ether, _erc20SwapData(5 ether, 99 ether, address(vault)));

        assertEq(fee.balanceOf(address(vault)), treasuryBefore);
        assertEq(vault.executionCount(), 0);
        assertEq(vault.totalInputSpent(), 0);
    }

    function testPausedContractRejectsExecution() public {
        _deposit(5 ether);
        vm.prank(owner);
        vault.pause();

        vm.prank(keeper);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        vault.executeBuyback(5 ether, 1, hex"12345678");
    }

    function testReentrancyAttemptFails() public {
        BuybackVault nativeVault = _newNativeVault(address(router), keeper);
        ReentrantRouter attacker = new ReentrantRouter(nativeVault, zazu);
        vm.startPrank(owner);
        nativeVault.setKeeper(address(attacker));
        nativeVault.setDexRouter(address(attacker));
        zazu.transfer(address(attacker), 1000 ether);
        vm.stopPrank();
        vm.deal(depositor, 5 ether);
        vm.prank(depositor);
        (bool deposited,) = address(nativeVault).call{ value: 5 ether }("");
        assertTrue(deposited);
        vm.warp(block.timestamp + nativeVault.minimumInterval());

        bytes memory data = abi.encode(100 ether);
        vm.expectPartialRevert(BuybackVault.RouterCallFailed.selector);
        attacker.begin(5 ether, 1, data);

        assertEq(nativeVault.executionCount(), 0);
        assertEq(address(nativeVault).balance, 5 ether);
    }

    function testInvalidDestinationRejected() public {
        vm.prank(owner);
        vm.expectRevert(BuybackVault.ZeroAddress.selector);
        vault.setBuybackDestination(address(0));
    }

    function testIncorrectRouterInputSpendReverts() public {
        _deposit(5 ether);
        bytes memory data = _routeData(100 ether, 4 ether, address(0), false);

        vm.prank(keeper);
        vm.expectRevert(
            abi.encodeWithSelector(
                BuybackVault.IncorrectInputAmountSpent.selector, 5 ether, 4 ether
            )
        );
        vault.executeBuyback(5 ether, 1, data);
    }

    function testRouterMustSendOutputToVault() public {
        _deposit(5 ether);
        bytes memory data = _erc20SwapData(5 ether, 100 ether, destination);

        vm.prank(keeper);
        vm.expectRevert(
            abi.encodeWithSelector(BuybackVault.InsufficientZazuReceived.selector, 0, 1)
        );
        vault.executeBuyback(5 ether, 1, data);
    }

    function testVaultOwnershipTransferIsTwoStep() public {
        address nextOwner = makeAddr("nextOwner");
        vm.prank(owner);
        vault.transferOwnership(nextOwner);
        assertEq(vault.owner(), owner);

        vm.prank(nextOwner);
        vault.acceptOwnership();
        assertEq(vault.owner(), nextOwner);
    }

    function testKeeperReplacementEmitsEventAndRevokesOldKeeper() public {
        address newKeeper = makeAddr("newKeeper");
        vm.expectEmit(false, false, false, true, address(vault));
        emit KeeperUpdated(keeper, newKeeper);
        vm.prank(owner);
        vault.setKeeper(newKeeper);

        _deposit(5 ether);
        vm.prank(keeper);
        vm.expectRevert(abi.encodeWithSelector(BuybackVault.UnauthorizedKeeper.selector, keeper));
        vault.executeBuyback(5 ether, 1, hex"12345678");
    }

    function testRouterAndDestinationChangesAreTimelockedOnceEnabled() public {
        address nextRouter = makeAddr("nextRouter");
        address nextDestination = makeAddr("rewardsVault");
        vm.startPrank(owner);
        vault.enableConfigurationTimelock(1 days);
        vault.setDexRouter(nextRouter);
        vault.setBuybackDestination(nextDestination);
        vm.expectPartialRevert(BuybackVault.TimelockNotElapsed.selector);
        vault.executeDexRouterUpdate();
        vm.expectPartialRevert(BuybackVault.TimelockNotElapsed.selector);
        vault.executeBuybackDestinationUpdate();

        vm.warp(block.timestamp + 1 days);
        vm.expectEmit(false, false, false, true, address(vault));
        emit RouterUpdated(address(router), nextRouter);
        vault.executeDexRouterUpdate();
        vm.expectEmit(false, false, false, true, address(vault));
        emit DestinationUpdated(destination, nextDestination);
        vault.executeBuybackDestinationUpdate();
        vm.stopPrank();

        assertEq(vault.dexRouter(), nextRouter);
        assertEq(vault.buybackDestination(), nextDestination);
    }

    function testProtectedAssetsRequirePauseAndTimelockForRescue() public {
        _deposit(5 ether);
        vm.prank(owner);
        zazu.transfer(address(vault), 500 ether);

        vm.startPrank(owner);
        vm.expectRevert(Pausable.ExpectedPause.selector);
        vault.rescueUnsupportedToken(address(zazu), owner);
        vault.pause();
        vm.expectRevert(BuybackVault.ProtectedAsset.selector);
        vault.rescueUnsupportedToken(address(zazu), owner);
        vm.expectRevert(BuybackVault.ProtectedAsset.selector);
        vault.rescueUnsupportedToken(address(fee), owner);
        vm.expectRevert(BuybackVault.TimelockNotEnabled.selector);
        vault.scheduleProtectedTokenRescue(address(zazu), owner);

        vault.enableConfigurationTimelock(1 hours);
        vault.scheduleProtectedTokenRescue(address(zazu), owner);
        vm.expectPartialRevert(BuybackVault.TimelockNotElapsed.selector);
        vault.executeProtectedTokenRescue();
        vm.warp(block.timestamp + 1 hours);
        uint256 ownerBefore = zazu.balanceOf(owner);
        vault.executeProtectedTokenRescue();
        vm.stopPrank();

        assertEq(zazu.balanceOf(owner), ownerBefore + 500 ether);
        assertEq(fee.balanceOf(address(vault)), 5 ether);
    }

    function testUnsupportedTokenCanOnlyBeRescuedWhilePaused() public {
        MockERC20 accidental = new MockERC20("Accidental", "OOPS");
        accidental.mint(address(vault), 7 ether);

        vm.prank(owner);
        vm.expectRevert(Pausable.ExpectedPause.selector);
        vault.rescueUnsupportedToken(address(accidental), owner);

        vm.startPrank(owner);
        vault.pause();
        vault.rescueUnsupportedToken(address(accidental), owner);
        vm.stopPrank();
        assertEq(accidental.balanceOf(owner), 7 ether);
    }

    function testConfiguredFeeAssetRescueRequiresPauseAndCompletedTimelock() public {
        vm.prank(depositor);
        fee.transfer(address(vault), 5 ether);
        assertEq(vault.totalDeposited(), 0);
        vm.startPrank(owner);
        vault.pause();
        vault.enableConfigurationTimelock(1 hours);
        vault.scheduleProtectedTokenRescue(address(fee), owner);
        vm.stopPrank();

        // Funds arriving after scheduling are not included in the aged rescue.
        vm.prank(depositor);
        fee.transfer(address(vault), 2 ether);
        vm.warp(block.timestamp + 1 hours);
        uint256 ownerBefore = fee.balanceOf(owner);
        vm.prank(owner);
        vault.executeProtectedTokenRescue();

        assertEq(fee.balanceOf(owner), ownerBefore + 5 ether);
        assertEq(vault.totalDeposited(), 7 ether);
        assertEq(vault.totalFeeAssetRescued(), 5 ether);
        assertEq(vault.availableTreasuryBalance(), 2 ether);
        assertEq(vault.syncTreasuryBalance(), 0);
    }

    function testUnpauseCancelsPendingProtectedRescue() public {
        vm.prank(owner);
        zazu.transfer(address(vault), 500 ether);

        vm.startPrank(owner);
        vault.pause();
        vault.enableConfigurationTimelock(1 hours);
        vault.scheduleProtectedTokenRescue(address(zazu), owner);
        vault.unpause();
        vm.warp(block.timestamp + 1 hours);
        vault.pause();
        vm.expectRevert(BuybackVault.NoPendingChange.selector);
        vault.executeProtectedTokenRescue();
        vm.stopPrank();

        assertEq(zazu.balanceOf(address(vault)), 500 ether);
    }

    function testMaximumSlippageHasHardCap() public {
        vm.prank(owner);
        vm.expectRevert(BuybackVault.InvalidSlippage.selector);
        vault.setMaximumSlippageBps(501);
    }

    function testForcedNativeCanBeRescuedOnlyWhenItIsNotTheFeeAsset() public {
        vm.deal(address(vault), 2 ether);
        uint256 ownerBefore = owner.balance;

        vm.startPrank(owner);
        vault.pause();
        vault.rescueUnsupportedNative(owner);
        vm.stopPrank();

        assertEq(owner.balance, ownerBefore + 2 ether);
        assertEq(address(vault).balance, 0);

        BuybackVault nativeVault = _newNativeVault(address(router), keeper);
        vm.deal(address(nativeVault), 1 ether);
        vm.startPrank(owner);
        nativeVault.pause();
        vm.expectRevert(BuybackVault.ProtectedAsset.selector);
        nativeVault.rescueUnsupportedNative(owner);
        vm.stopPrank();
    }

    function testFuzzSuccessfulBuybackAtAmountBoundaries(uint96 seed) public {
        uint256 amount = bound(uint256(seed), MIN_AMOUNT, MAX_AMOUNT);
        fee.mint(depositor, amount);
        vm.prank(depositor);
        vault.depositERC20(amount);
        uint256 output = amount * 10;

        vm.prank(keeper);
        vault.executeBuyback(amount, output, _erc20SwapData(amount, output, address(vault)));
        assertEq(vault.totalInputSpent(), amount);
        assertEq(vault.totalZazuBought(), output);
    }

    function testFuzzRejectsAmountsBelowMinimum(uint96 seed) public {
        uint256 amount = bound(uint256(seed), 0, MIN_AMOUNT - 1);
        _deposit(MIN_AMOUNT);
        vm.prank(keeper);
        vm.expectRevert(BuybackVault.InvalidAmount.selector);
        vault.executeBuyback(amount, 1, hex"12345678");
    }

    function testFuzzRejectsAmountsAboveMaximum(uint96 seed) public {
        uint256 amount = bound(uint256(seed), MAX_AMOUNT + 1, type(uint96).max);
        vm.prank(keeper);
        vm.expectRevert(BuybackVault.InvalidAmount.selector);
        vault.executeBuyback(amount, 1, hex"12345678");
    }

    function _newErc20Vault(address routerAddress, address keeperAddress)
        internal
        returns (BuybackVault)
    {
        return new BuybackVault(
            owner,
            address(zazu),
            routerAddress,
            wrappedNative,
            address(fee),
            destination,
            keeperAddress,
            MIN_AMOUNT,
            MAX_AMOUNT,
            SLIPPAGE_BPS
        );
    }

    function _newNativeVault(address routerAddress, address keeperAddress)
        internal
        returns (BuybackVault)
    {
        return new BuybackVault(
            owner,
            address(zazu),
            routerAddress,
            wrappedNative,
            address(0),
            destination,
            keeperAddress,
            MIN_AMOUNT,
            MAX_AMOUNT,
            SLIPPAGE_BPS
        );
    }

    function _deposit(uint256 amount) internal {
        vm.prank(depositor);
        vault.depositERC20(amount);
    }

    function _erc20SwapData(uint256 amountIn, uint256 amountOut, address recipient)
        internal
        view
        returns (bytes memory)
    {
        address recipientOverride = recipient == address(vault) ? address(0) : recipient;
        return _routeData(amountOut, amountIn, recipientOverride, false);
    }

    function _routeData(
        uint256 amountOut,
        uint256 amountToSpend,
        address recipientOverride,
        bool shouldRevert
    ) internal pure returns (bytes memory) {
        return abi.encode(amountOut, amountToSpend, recipientOverride, shouldRevert);
    }
}
