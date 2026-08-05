// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Test } from "forge-std/Test.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { BuybackVault } from "../src/BuybackVault.sol";
import { PonsFeeCollector } from "../src/PonsFeeCollector.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";
import { MockPonsLaunchLocker } from "./mocks/MockPonsLaunchLocker.sol";
import { MockRouter } from "./mocks/MockRouter.sol";

contract PonsFeeCollectorTest is Test {
    address internal constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    event CollectorConfigured(address indexed zazuToken, address indexed buybackVault);
    event CreatorFeesForwarded(uint256 wrappedNativeAmount, uint256 zazuAmount);

    address internal owner = makeAddr("owner");
    address internal keeper = makeAddr("keeper");
    address internal caller = makeAddr("permissionlessCaller");

    MockERC20 internal weth;
    MockERC20 internal zazu;
    MockRouter internal router;
    MockPonsLaunchLocker internal ponsLocker;
    BuybackVault internal vault;
    PonsFeeCollector internal collector;

    function setUp() public {
        weth = new MockERC20("Wrapped Ether", "WETH");
        zazu = new MockERC20("Zazu", "ZAZU");
        router = new MockRouter();
        ponsLocker = new MockPonsLaunchLocker(address(weth));
        vault = _newVault(address(zazu), address(weth), BURN_ADDRESS);
        collector = new PonsFeeCollector(owner, address(weth), address(ponsLocker));
        ponsLocker.setFeeRedirect(address(zazu), address(collector));

        vm.expectEmit(true, true, false, true, address(collector));
        emit CollectorConfigured(address(zazu), address(vault));
        vm.prank(owner);
        collector.configure(address(zazu), address(vault));
    }

    function testConfigurePinsValidatedTokenVaultAndBurnDestination() public view {
        assertTrue(collector.configured());
        assertEq(address(collector.wrappedNativeToken()), address(weth));
        assertEq(address(collector.ponsLocker()), address(ponsLocker));
        assertEq(address(collector.zazuToken()), address(zazu));
        assertEq(address(collector.buybackVault()), address(vault));
    }

    function testFlushIsPermissionlessAndForwardsBothCreatorFeeAssets() public {
        uint256 wethAmount = 4 ether;
        uint256 zazuAmount = 750 ether;
        weth.mint(address(collector), wethAmount);
        zazu.mint(address(collector), zazuAmount);

        vm.expectEmit(false, false, false, true, address(collector));
        emit CreatorFeesForwarded(wethAmount, zazuAmount);
        vm.prank(caller);
        (uint256 forwardedWeth, uint256 forwardedZazu) = collector.flush();

        assertEq(forwardedWeth, wethAmount);
        assertEq(forwardedZazu, zazuAmount);
        assertEq(weth.balanceOf(address(collector)), 0);
        assertEq(zazu.balanceOf(address(collector)), 0);
        assertEq(weth.balanceOf(address(vault)), wethAmount);
        assertEq(vault.totalDeposited(), wethAmount);
        assertEq(zazu.balanceOf(vault.DEFAULT_BURN_ADDRESS()), zazuAmount);
        assertEq(zazu.balanceOf(address(vault)), 0);
        assertEq(vault.totalZazuBought(), 0);
        assertEq(vault.totalZazuBurned(), zazuAmount);
    }

    function testFlushWrappedNativeOnlySyncsTreasuryAccounting() public {
        weth.mint(address(collector), 3 ether);

        vm.prank(caller);
        (uint256 forwardedWeth, uint256 forwardedZazu) = collector.flush();

        assertEq(forwardedWeth, 3 ether);
        assertEq(forwardedZazu, 0);
        assertEq(weth.balanceOf(address(vault)), 3 ether);
        assertEq(vault.totalDeposited(), 3 ether);
        assertEq(vault.totalZazuBurned(), 0);
    }

    function testFlushZazuOnlyBurnsWithoutChangingBuybackAccounting() public {
        zazu.mint(address(collector), 99 ether);

        vm.prank(caller);
        (uint256 forwardedWeth, uint256 forwardedZazu) = collector.flush();

        assertEq(forwardedWeth, 0);
        assertEq(forwardedZazu, 99 ether);
        assertEq(vault.totalDeposited(), 0);
        assertEq(vault.totalInputSpent(), 0);
        assertEq(vault.totalZazuBought(), 0);
        assertEq(vault.totalZazuBurned(), 99 ether);
    }

    function testEmptyFlushIsSafeAndReturnsZero() public {
        vm.expectEmit(false, false, false, true, address(collector));
        emit CreatorFeesForwarded(0, 0);
        vm.prank(caller);
        (uint256 forwardedWeth, uint256 forwardedZazu) = collector.flush();

        assertEq(forwardedWeth, 0);
        assertEq(forwardedZazu, 0);
    }

    function testClaimAndFlushCollectsLockerFeesBeforeForwarding() public {
        uint256 wethAmount = 2 ether;
        uint256 zazuAmount = 400 ether;
        weth.mint(address(ponsLocker), wethAmount);
        zazu.mint(address(ponsLocker), zazuAmount);
        ponsLocker.setClaimAmounts(wethAmount, zazuAmount);

        vm.prank(caller);
        (uint256 forwardedWeth, uint256 forwardedZazu) = collector.claimAndFlush();

        assertEq(ponsLocker.collectCallCount(), 1);
        assertEq(forwardedWeth, wethAmount);
        assertEq(forwardedZazu, zazuAmount);
        assertEq(vault.totalDeposited(), wethAmount);
        assertEq(vault.totalZazuBurned(), zazuAmount);
        assertEq(zazu.balanceOf(vault.DEFAULT_BURN_ADDRESS()), zazuAmount);
    }

    function testClaimAndFlushToleratesOnlyNoFeesErrorAndFlushesExistingBalances() public {
        weth.mint(address(collector), 1 ether);
        ponsLocker.setShouldReportNoFees(true);

        vm.prank(caller);
        (uint256 forwardedWeth, uint256 forwardedZazu) = collector.claimAndFlush();

        assertEq(forwardedWeth, 1 ether);
        assertEq(forwardedZazu, 0);
        assertEq(vault.totalDeposited(), 1 ether);
        assertEq(ponsLocker.collectCallCount(), 0);
    }

    function testClaimAndFlushBubblesUnexpectedLockerFailure() public {
        weth.mint(address(collector), 1 ether);
        ponsLocker.setShouldRevert(true);

        vm.prank(caller);
        vm.expectRevert(MockPonsLaunchLocker.CollectFailed.selector);
        collector.claimAndFlush();

        assertEq(weth.balanceOf(address(collector)), 1 ether);
        assertEq(weth.balanceOf(address(vault)), 0);
        assertEq(vault.totalDeposited(), 0);
    }

    function testUnconfiguredCollectorCannotFlush() public {
        PonsFeeCollector fresh = new PonsFeeCollector(owner, address(weth), address(ponsLocker));
        vm.expectRevert(PonsFeeCollector.NotConfigured.selector);
        fresh.flush();

        vm.expectRevert(PonsFeeCollector.NotConfigured.selector);
        fresh.claimAndFlush();
    }

    function testCollectorCanOnlyBeConfiguredOnce() public {
        vm.prank(owner);
        vm.expectRevert(PonsFeeCollector.AlreadyConfigured.selector);
        collector.configure(address(zazu), address(vault));
    }

    function testOnlyOwnerCanConfigure() public {
        PonsFeeCollector fresh = new PonsFeeCollector(owner, address(weth), address(ponsLocker));
        vm.prank(caller);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, caller));
        fresh.configure(address(zazu), address(vault));
    }

    function testConfigureRejectsVaultTokenMismatch() public {
        MockERC20 other = new MockERC20("Other", "OTHER");
        PonsFeeCollector fresh = new PonsFeeCollector(owner, address(weth), address(ponsLocker));

        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                PonsFeeCollector.VaultTokenMismatch.selector, address(other), address(zazu)
            )
        );
        fresh.configure(address(other), address(vault));
    }

    function testConfigureRejectsVaultFeeTokenMismatch() public {
        MockERC20 otherFee = new MockERC20("Other Fee", "OTHER");
        BuybackVault wrongVault = _newVault(address(zazu), address(otherFee), BURN_ADDRESS);
        PonsFeeCollector fresh = new PonsFeeCollector(owner, address(weth), address(ponsLocker));

        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                PonsFeeCollector.VaultFeeTokenMismatch.selector, address(weth), address(otherFee)
            )
        );
        fresh.configure(address(zazu), address(wrongVault));
    }

    function testConfigureRejectsNonCanonicalDestination() public {
        BuybackVault wrongVault = _newVault(address(zazu), address(weth), makeAddr("rewardsVault"));
        PonsFeeCollector fresh = new PonsFeeCollector(owner, address(weth), address(ponsLocker));

        vm.prank(owner);
        vm.expectPartialRevert(PonsFeeCollector.VaultBurnDestinationMismatch.selector);
        fresh.configure(address(zazu), address(wrongVault));
    }

    function testConfigureRejectsAddressesWithoutCode() public {
        PonsFeeCollector fresh = new PonsFeeCollector(owner, address(weth), address(ponsLocker));
        address noCode = makeAddr("noCode");

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(PonsFeeCollector.AddressHasNoCode.selector, noCode));
        fresh.configure(noCode, address(vault));
    }

    function testConfigureRejectsLockerFeeRedirectMismatch() public {
        PonsFeeCollector fresh = new PonsFeeCollector(owner, address(weth), address(ponsLocker));

        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                PonsFeeCollector.FeeRedirectMismatch.selector, address(fresh), address(collector)
            )
        );
        fresh.configure(address(zazu), address(vault));
    }

    function testConstructorRejectsInvalidWrappedNativeToken() public {
        vm.expectRevert(PonsFeeCollector.ZeroAddress.selector);
        new PonsFeeCollector(owner, address(0), address(ponsLocker));

        vm.expectRevert(PonsFeeCollector.ZeroAddress.selector);
        new PonsFeeCollector(owner, address(weth), address(0));

        address noCode = makeAddr("noCode");
        vm.expectRevert(abi.encodeWithSelector(PonsFeeCollector.AddressHasNoCode.selector, noCode));
        new PonsFeeCollector(owner, noCode, address(ponsLocker));

        vm.expectRevert(abi.encodeWithSelector(PonsFeeCollector.AddressHasNoCode.selector, noCode));
        new PonsFeeCollector(owner, address(weth), noCode);
    }

    function _newVault(address token, address feeToken, address destination)
        internal
        returns (BuybackVault)
    {
        return new BuybackVault(
            owner,
            token,
            address(router),
            address(weth),
            feeToken,
            destination,
            keeper,
            1 ether,
            10 ether,
            500
        );
    }
}
