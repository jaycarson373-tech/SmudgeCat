// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IDexAdapter } from "../../src/interfaces/IDexAdapter.sol";

/// @dev Test-only adapter. Route data is
///      abi.encode(amountOut, amountToSpend, recipientOverride, shouldRevert).
contract MockRouter is IDexAdapter {
    using SafeERC20 for IERC20;

    address public lastInputToken;
    address public lastOutputToken;
    uint256 public lastAmountIn;
    uint256 public lastMinimumAmountOut;
    address public lastRecipient;

    function swap(
        address inputToken,
        address outputToken,
        uint256 amountIn,
        uint256 minimumAmountOut,
        address recipient,
        bytes calldata routeData
    ) external payable returns (uint256 reportedAmountOut) {
        (uint256 amountOut, uint256 amountToSpend, address recipientOverride, bool shouldRevert) =
            abi.decode(routeData, (uint256, uint256, address, bool));
        if (shouldRevert) revert("MOCK_ADAPTER_REVERT");

        lastInputToken = inputToken;
        lastOutputToken = outputToken;
        lastAmountIn = amountIn;
        lastMinimumAmountOut = minimumAmountOut;
        lastRecipient = recipient;

        if (inputToken == address(0)) {
            require(msg.value == amountIn, "WRONG_NATIVE_VALUE");
            require(amountToSpend == amountIn, "NATIVE_PARTIAL_SPEND_UNSUPPORTED");
        } else {
            require(msg.value == 0, "UNEXPECTED_NATIVE_VALUE");
            IERC20(inputToken).safeTransferFrom(msg.sender, address(this), amountToSpend);
        }

        address outputRecipient = recipientOverride == address(0) ? recipient : recipientOverride;
        IERC20(outputToken).safeTransfer(outputRecipient, amountOut);
        return amountOut;
    }
}
