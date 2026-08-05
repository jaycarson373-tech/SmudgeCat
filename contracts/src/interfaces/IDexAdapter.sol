// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title Narrow DEX Adapter Interface
/// @notice A separately verified adapter translates route data into calls to one supported DEX.
/// @dev Implementations must spend no more than `amountIn` and send output to `recipient`.
interface IDexAdapter {
    function swap(
        address inputToken,
        address outputToken,
        uint256 amountIn,
        uint256 minimumAmountOut,
        address recipient,
        bytes calldata routeData
    ) external payable returns (uint256 reportedAmountOut);
}
