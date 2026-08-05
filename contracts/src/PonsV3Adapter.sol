// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IDexAdapter } from "./interfaces/IDexAdapter.sol";

interface IPonsV3SwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}

/// @title Pons V3 Adapter
/// @notice A deliberately narrow adapter from BuybackVault to the pons WETH/ZAZU V3 pool.
/// @dev The adapter accepts only the immutable WETH -> ZAZU pair and always returns output to
///      the calling vault. No arbitrary calldata or recipient can be injected by the keeper.
contract PonsV3Adapter is IDexAdapter {
    using SafeERC20 for IERC20;

    address public immutable ponsSwapRouter;
    address public immutable wrappedNativeToken;
    address public immutable zazuToken;
    uint24 public immutable poolFee;

    error ZeroAddress();
    error AddressHasNoCode(address value);
    error InvalidPoolFee();
    error UnsupportedPair(address inputToken, address outputToken);
    error InvalidRecipient(address recipient, address caller);
    error InvalidAmount();
    error UnexpectedRouteData();
    error NativeInputUnsupported();

    constructor(
        address ponsSwapRouter_,
        address wrappedNativeToken_,
        address zazuToken_,
        uint24 poolFee_
    ) {
        if (
            ponsSwapRouter_ == address(0) || wrappedNativeToken_ == address(0)
                || zazuToken_ == address(0)
        ) revert ZeroAddress();
        if (ponsSwapRouter_.code.length == 0) revert AddressHasNoCode(ponsSwapRouter_);
        if (wrappedNativeToken_.code.length == 0) revert AddressHasNoCode(wrappedNativeToken_);
        if (zazuToken_.code.length == 0) revert AddressHasNoCode(zazuToken_);
        if (poolFee_ == 0) revert InvalidPoolFee();

        ponsSwapRouter = ponsSwapRouter_;
        wrappedNativeToken = wrappedNativeToken_;
        zazuToken = zazuToken_;
        poolFee = poolFee_;
    }

    function swap(
        address inputToken,
        address outputToken,
        uint256 amountIn,
        uint256 minimumAmountOut,
        address recipient,
        bytes calldata routeData
    ) external payable returns (uint256 reportedAmountOut) {
        if (msg.value != 0) revert NativeInputUnsupported();
        if (inputToken != wrappedNativeToken || outputToken != zazuToken) {
            revert UnsupportedPair(inputToken, outputToken);
        }
        if (recipient != msg.sender) revert InvalidRecipient(recipient, msg.sender);
        if (amountIn == 0 || minimumAmountOut == 0) revert InvalidAmount();
        if (routeData.length != 0) revert UnexpectedRouteData();

        IERC20 input = IERC20(inputToken);
        input.safeTransferFrom(msg.sender, address(this), amountIn);
        input.forceApprove(ponsSwapRouter, amountIn);

        reportedAmountOut = IPonsV3SwapRouter(ponsSwapRouter)
            .exactInputSingle(
                IPonsV3SwapRouter.ExactInputSingleParams({
                tokenIn: inputToken,
                tokenOut: outputToken,
                fee: poolFee,
                recipient: recipient,
                amountIn: amountIn,
                amountOutMinimum: minimumAmountOut,
                sqrtPriceLimitX96: 0
            })
            );

        input.forceApprove(ponsSwapRouter, 0);
    }
}
