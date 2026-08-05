// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Test } from "forge-std/Test.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { BuybackVault } from "../src/BuybackVault.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";
import { MockRouter } from "./mocks/MockRouter.sol";

contract BuybackVaultBurnTest is Test {
    address internal constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    event DirectZazuBurned(uint256 amount, address indexed destination, uint256 timestamp);

    address internal owner = makeAddr("owner");
    address internal keeper = makeAddr("keeper");
    address internal depositor = makeAddr("depositor");
    address internal caller = makeAddr("permissionlessCaller");

    MockERC20 internal zazu;
    MockERC20 internal weth;
    MockRouter internal router;
    BuybackVault internal burnVault;

    function setUp() public {
        vm.warp(30 days);
        zazu = new MockERC20("Zazu", "ZAZU");
        weth = new MockERC20("Wrapped Ether", "WETH");
        router = new MockRouter();
        burnVault = _newVault(BURN_ADDRESS);

        weth.mint(depositor, 100 ether);
        zazu.mint(address(router), 1_000_000 ether);
        vm.prank(depositor);
        weth.approve(address(burnVault), type(uint256).max);
        vm.warp(block.timestamp + burnVault.minimumInterval());
    }

    function testSuccessfulBuybackTracksBoughtAndBurnedAtCanonicalDestination() public {
        vm.prank(depositor);
        burnVault.depositERC20(5 ether);

        vm.prank(keeper);
        burnVault.executeBuyback(5 ether, 100 ether, _routeData(100 ether, 5 ether));

        assertEq(burnVault.totalZazuBought(), 100 ether);
        assertEq(burnVault.totalZazuBurned(), 100 ether);
        assertEq(zazu.balanceOf(burnVault.DEFAULT_BURN_ADDRESS()), 100 ether);
        assertEq(zazu.balanceOf(address(burnVault)), 0);
    }

    function testSuccessfulBuybackToNonBurnDestinationDoesNotCountAsBurned() public {
        address rewardsVault = makeAddr("rewardsVault");
        BuybackVault rewardsModeVault = _newVault(rewardsVault);
        vm.prank(depositor);
        weth.approve(address(rewardsModeVault), type(uint256).max);
        vm.prank(depositor);
        rewardsModeVault.depositERC20(5 ether);
        vm.warp(block.timestamp + rewardsModeVault.minimumInterval());

        vm.prank(keeper);
        rewardsModeVault.executeBuyback(5 ether, 100 ether, _routeData(100 ether, 5 ether));

        assertEq(rewardsModeVault.totalZazuBought(), 100 ether);
        assertEq(rewardsModeVault.totalZazuBurned(), 0);
        assertEq(zazu.balanceOf(rewardsVault), 100 ether);
    }

    function testBurnDirectZazuIsPermissionlessAndTracksCanonicalBurn() public {
        zazu.mint(address(burnVault), 250 ether);

        vm.expectEmit(true, false, false, true, address(burnVault));
        emit DirectZazuBurned(250 ether, burnVault.DEFAULT_BURN_ADDRESS(), block.timestamp);
        vm.prank(caller);
        uint256 amount = burnVault.burnDirectZazu();

        assertEq(amount, 250 ether);
        assertEq(burnVault.totalZazuBurned(), 250 ether);
        assertEq(burnVault.totalZazuBought(), 0);
        assertEq(zazu.balanceOf(burnVault.DEFAULT_BURN_ADDRESS()), 250 ether);
        assertEq(zazu.balanceOf(address(burnVault)), 0);
    }

    function testBurnDirectZazuAccumulatesAcrossCalls() public {
        zazu.mint(address(burnVault), 10 ether);
        burnVault.burnDirectZazu();
        zazu.mint(address(burnVault), 15 ether);
        vm.prank(caller);
        burnVault.burnDirectZazu();

        assertEq(burnVault.totalZazuBurned(), 25 ether);
        assertEq(zazu.balanceOf(burnVault.DEFAULT_BURN_ADDRESS()), 25 ether);
    }

    function testBurnDirectZazuReturnsZeroWhenVaultIsEmpty() public {
        vm.prank(caller);
        uint256 amount = burnVault.burnDirectZazu();

        assertEq(amount, 0);
        assertEq(burnVault.totalZazuBurned(), 0);
    }

    function testBurnDirectZazuRejectsNonCanonicalDestination() public {
        address rewardsVault = makeAddr("rewardsVault");
        BuybackVault rewardsModeVault = _newVault(rewardsVault);
        zazu.mint(address(rewardsModeVault), 20 ether);

        vm.prank(caller);
        vm.expectRevert(
            abi.encodeWithSelector(BuybackVault.BurnDestinationNotActive.selector, rewardsVault)
        );
        rewardsModeVault.burnDirectZazu();

        assertEq(zazu.balanceOf(address(rewardsModeVault)), 20 ether);
        assertEq(rewardsModeVault.totalZazuBurned(), 0);
    }

    function testBurnDirectZazuRejectsWhilePaused() public {
        zazu.mint(address(burnVault), 20 ether);
        vm.prank(owner);
        burnVault.pause();

        vm.prank(caller);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        burnVault.burnDirectZazu();

        assertEq(zazu.balanceOf(address(burnVault)), 20 ether);
        assertEq(burnVault.totalZazuBurned(), 0);
    }

    function _newVault(address destination) internal returns (BuybackVault) {
        return new BuybackVault(
            owner,
            address(zazu),
            address(router),
            address(weth),
            address(weth),
            destination,
            keeper,
            1 ether,
            10 ether,
            500
        );
    }

    function _routeData(uint256 amountOut, uint256 amountToSpend)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encode(amountOut, amountToSpend, address(0), false);
    }
}
