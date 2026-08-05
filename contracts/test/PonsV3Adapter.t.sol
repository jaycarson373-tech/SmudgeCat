// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Test } from "forge-std/Test.sol";
import { PonsV3Adapter } from "../src/PonsV3Adapter.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";
import { MockPonsV3SwapRouter } from "./mocks/MockPonsV3SwapRouter.sol";

contract PonsV3AdapterTest is Test {
    uint24 internal constant POOL_FEE = 10_000;

    address internal trader = makeAddr("trader");
    address internal stranger = makeAddr("stranger");

    MockERC20 internal weth;
    MockERC20 internal zazu;
    MockPonsV3SwapRouter internal router;
    PonsV3Adapter internal adapter;

    function setUp() public {
        weth = new MockERC20("Wrapped Ether", "WETH");
        zazu = new MockERC20("Zazu", "ZAZU");
        router = new MockPonsV3SwapRouter();
        adapter = new PonsV3Adapter(address(router), address(weth), address(zazu), POOL_FEE);

        weth.mint(trader, 100 ether);
        zazu.mint(address(router), 1_000_000 ether);
        vm.prank(trader);
        weth.approve(address(adapter), type(uint256).max);
    }

    function testConstructorSetsImmutableRoute() public view {
        assertEq(adapter.ponsSwapRouter(), address(router));
        assertEq(adapter.wrappedNativeToken(), address(weth));
        assertEq(adapter.zazuToken(), address(zazu));
        assertEq(adapter.poolFee(), POOL_FEE);
    }

    function testConstructorRejectsZeroAddressesAndZeroFee() public {
        vm.expectRevert(PonsV3Adapter.ZeroAddress.selector);
        new PonsV3Adapter(address(0), address(weth), address(zazu), POOL_FEE);

        vm.expectRevert(PonsV3Adapter.ZeroAddress.selector);
        new PonsV3Adapter(address(router), address(0), address(zazu), POOL_FEE);

        vm.expectRevert(PonsV3Adapter.ZeroAddress.selector);
        new PonsV3Adapter(address(router), address(weth), address(0), POOL_FEE);

        vm.expectRevert(PonsV3Adapter.InvalidPoolFee.selector);
        new PonsV3Adapter(address(router), address(weth), address(zazu), 0);
    }

    function testConstructorRejectsRouteAddressesWithoutCode() public {
        address noCode = makeAddr("noCode");

        vm.expectRevert(abi.encodeWithSelector(PonsV3Adapter.AddressHasNoCode.selector, noCode));
        new PonsV3Adapter(noCode, address(weth), address(zazu), POOL_FEE);

        vm.expectRevert(abi.encodeWithSelector(PonsV3Adapter.AddressHasNoCode.selector, noCode));
        new PonsV3Adapter(address(router), noCode, address(zazu), POOL_FEE);

        vm.expectRevert(abi.encodeWithSelector(PonsV3Adapter.AddressHasNoCode.selector, noCode));
        new PonsV3Adapter(address(router), address(weth), noCode, POOL_FEE);
    }

    function testSwapUsesOnlyPinnedPairAndClearsRouterApproval() public {
        uint256 amountIn = 5 ether;
        uint256 minimumOut = 120 ether;
        uint256 amountOut = 125 ether;
        router.setAmountOut(amountOut);

        vm.prank(trader);
        uint256 reported =
            adapter.swap(address(weth), address(zazu), amountIn, minimumOut, trader, bytes(""));

        assertEq(reported, amountOut);
        assertEq(weth.balanceOf(trader), 95 ether);
        assertEq(weth.balanceOf(address(router)), amountIn);
        assertEq(weth.balanceOf(address(adapter)), 0);
        assertEq(zazu.balanceOf(trader), amountOut);
        assertEq(weth.allowance(address(adapter), address(router)), 0);
        assertEq(router.lastCaller(), address(adapter));
        assertEq(router.lastTokenIn(), address(weth));
        assertEq(router.lastTokenOut(), address(zazu));
        assertEq(router.lastFee(), POOL_FEE);
        assertEq(router.lastRecipient(), trader);
        assertEq(router.lastAmountIn(), amountIn);
        assertEq(router.lastAmountOutMinimum(), minimumOut);
        assertEq(router.lastSqrtPriceLimitX96(), 0);
    }

    function testRejectsUnsupportedPair() public {
        vm.prank(trader);
        vm.expectRevert(
            abi.encodeWithSelector(
                PonsV3Adapter.UnsupportedPair.selector, address(zazu), address(weth)
            )
        );
        adapter.swap(address(zazu), address(weth), 1 ether, 1, trader, bytes(""));
    }

    function testRejectsRecipientOtherThanCaller() public {
        vm.prank(trader);
        vm.expectRevert(
            abi.encodeWithSelector(PonsV3Adapter.InvalidRecipient.selector, stranger, trader)
        );
        adapter.swap(address(weth), address(zazu), 1 ether, 1, stranger, bytes(""));
    }

    function testRejectsZeroInputOrMinimumOutput() public {
        vm.startPrank(trader);
        vm.expectRevert(PonsV3Adapter.InvalidAmount.selector);
        adapter.swap(address(weth), address(zazu), 0, 1, trader, bytes(""));

        vm.expectRevert(PonsV3Adapter.InvalidAmount.selector);
        adapter.swap(address(weth), address(zazu), 1 ether, 0, trader, bytes(""));
        vm.stopPrank();
    }

    function testRejectsArbitraryRouteData() public {
        vm.prank(trader);
        vm.expectRevert(PonsV3Adapter.UnexpectedRouteData.selector);
        adapter.swap(address(weth), address(zazu), 1 ether, 1, trader, hex"01");
    }

    function testRejectsNativeValue() public {
        vm.deal(trader, 1 ether);
        vm.prank(trader);
        vm.expectRevert(PonsV3Adapter.NativeInputUnsupported.selector);
        adapter.swap{ value: 1 }(address(weth), address(zazu), 1 ether, 1, trader, bytes(""));
    }

    function testRouterSlippageRevertRollsBackInputTransferAndApproval() public {
        router.setAmountOut(99 ether);
        uint256 traderBalanceBefore = weth.balanceOf(trader);

        vm.prank(trader);
        vm.expectRevert(
            abi.encodeWithSelector(
                MockPonsV3SwapRouter.InsufficientOutput.selector, 99 ether, 100 ether
            )
        );
        adapter.swap(address(weth), address(zazu), 5 ether, 100 ether, trader, bytes(""));

        assertEq(weth.balanceOf(trader), traderBalanceBefore);
        assertEq(weth.balanceOf(address(adapter)), 0);
        assertEq(weth.allowance(address(adapter), address(router)), 0);
        assertEq(zazu.balanceOf(trader), 0);
    }

    function testFuzzSwapPreservesExactPinnedRoute(uint96 rawAmountIn, uint96 rawAmountOut) public {
        uint256 amountIn = bound(uint256(rawAmountIn), 1, 100 ether);
        uint256 amountOut = bound(uint256(rawAmountOut), 1, 1_000_000 ether);
        router.setAmountOut(amountOut);

        vm.prank(trader);
        uint256 reported =
            adapter.swap(address(weth), address(zazu), amountIn, amountOut, trader, bytes(""));

        assertEq(reported, amountOut);
        assertEq(router.lastAmountIn(), amountIn);
        assertEq(router.lastAmountOutMinimum(), amountOut);
        assertEq(router.lastRecipient(), trader);
        assertEq(weth.allowance(address(adapter), address(router)), 0);
    }
}
