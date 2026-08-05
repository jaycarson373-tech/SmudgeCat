// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @dev Test double for the seven-field SwapRouter02 `exactInputSingle` entrypoint used by pons v1.
contract MockPonsV3SwapRouter {
    using SafeERC20 for IERC20;

    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    address public lastCaller;
    address public lastTokenIn;
    address public lastTokenOut;
    uint24 public lastFee;
    address public lastRecipient;
    uint256 public lastAmountIn;
    uint256 public lastAmountOutMinimum;
    uint160 public lastSqrtPriceLimitX96;

    uint256 public amountOut;
    bool public shouldRevert;

    error RouterFailure();
    error InsufficientOutput(uint256 received, uint256 minimumRequired);

    function setAmountOut(uint256 amountOut_) external {
        amountOut = amountOut_;
    }

    function setShouldRevert(bool shouldRevert_) external {
        shouldRevert = shouldRevert_;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256)
    {
        if (shouldRevert) revert RouterFailure();
        if (amountOut < params.amountOutMinimum) {
            revert InsufficientOutput(amountOut, params.amountOutMinimum);
        }

        lastCaller = msg.sender;
        lastTokenIn = params.tokenIn;
        lastTokenOut = params.tokenOut;
        lastFee = params.fee;
        lastRecipient = params.recipient;
        lastAmountIn = params.amountIn;
        lastAmountOutMinimum = params.amountOutMinimum;
        lastSqrtPriceLimitX96 = params.sqrtPriceLimitX96;

        IERC20(params.tokenIn).safeTransferFrom(msg.sender, address(this), params.amountIn);
        IERC20(params.tokenOut).safeTransfer(params.recipient, amountOut);
        return amountOut;
    }
}
