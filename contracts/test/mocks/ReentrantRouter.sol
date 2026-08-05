// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { BuybackVault } from "../../src/BuybackVault.sol";
import { IDexAdapter } from "../../src/interfaces/IDexAdapter.sol";

contract ReentrantRouter is IDexAdapter {
    using SafeERC20 for IERC20;

    BuybackVault public immutable vault;
    IERC20 public immutable zazu;

    constructor(BuybackVault vault_, IERC20 zazu_) {
        vault = vault_;
        zazu = zazu_;
    }

    function begin(uint256 amountIn, uint256 minimumOut, bytes calldata routeData) external {
        vault.executeBuyback(amountIn, minimumOut, routeData);
    }

    function swap(
        address,
        address,
        uint256 amountIn,
        uint256,
        address recipient,
        bytes calldata data
    ) external payable returns (uint256 amountOut) {
        amountOut = abi.decode(data, (uint256));
        vault.executeBuyback(amountIn, 1, "");
        zazu.safeTransfer(recipient, amountOut);
    }
}
