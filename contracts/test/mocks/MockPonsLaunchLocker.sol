// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockPonsLaunchLocker {
    using SafeERC20 for IERC20;

    IERC20 public immutable wrappedNativeToken;
    mapping(address token => address recipient) public feeRedirects;

    uint256 public wrappedNativeClaimAmount;
    uint256 public tokenClaimAmount;
    uint256 public collectCallCount;
    bool public shouldRevert;
    bool public shouldReportNoFees;

    error CollectFailed();
    error NoFeesToCollect();
    error RedirectNotConfigured();

    constructor(address wrappedNativeToken_) {
        wrappedNativeToken = IERC20(wrappedNativeToken_);
    }

    function setFeeRedirect(address token, address recipient) external {
        feeRedirects[token] = recipient;
    }

    function setClaimAmounts(uint256 wrappedNativeAmount, uint256 tokenAmount) external {
        wrappedNativeClaimAmount = wrappedNativeAmount;
        tokenClaimAmount = tokenAmount;
    }

    function setShouldRevert(bool shouldRevert_) external {
        shouldRevert = shouldRevert_;
    }

    function setShouldReportNoFees(bool shouldReportNoFees_) external {
        shouldReportNoFees = shouldReportNoFees_;
    }

    function collectFees(address token) external returns (uint256 amount0, uint256 amount1) {
        if (shouldRevert) revert CollectFailed();
        if (shouldReportNoFees) revert NoFeesToCollect();
        address recipient = feeRedirects[token];
        if (recipient == address(0)) revert RedirectNotConfigured();

        ++collectCallCount;
        amount0 = wrappedNativeClaimAmount;
        amount1 = tokenClaimAmount;
        wrappedNativeClaimAmount = 0;
        tokenClaimAmount = 0;

        if (amount0 != 0) wrappedNativeToken.safeTransfer(recipient, amount0);
        if (amount1 != 0) IERC20(token).safeTransfer(recipient, amount1);
    }
}
