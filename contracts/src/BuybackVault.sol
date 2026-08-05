// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Ownable2Step } from "@openzeppelin/contracts/access/Ownable2Step.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IDexAdapter } from "./interfaces/IDexAdapter.sol";

/// @title Zazu Buyback Vault
/// @notice Holds one configured fee asset and permits a keeper to execute bounded ZAZU buybacks.
/// @dev The router calldata must route purchased ZAZU back to this vault. The vault measures the
///      balance delta, enforces `minimumZazuOut`, and forwards exactly that delta to the configured
///      destination. `feeToken == address(0)` means the native gas token.
contract BuybackVault is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant minimumInterval = 15 minutes;
    uint256 public constant MAXIMUM_ALLOWED_SLIPPAGE_BPS = 500;
    uint48 public constant MINIMUM_CONFIGURATION_DELAY = 1 hours;
    address public constant DEFAULT_BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    IERC20 public immutable zazuToken;
    address public immutable wrappedNativeToken;
    address public immutable feeToken;

    address public dexRouter;
    address public buybackDestination;
    address public keeper;

    uint256 public minimumExecutionAmount;
    uint256 public maximumExecutionAmount;
    uint256 public maximumSlippageBps;
    uint256 public lastExecutionTime;

    uint256 public executionCount;
    uint256 public totalDeposited;
    uint256 public totalInputSpent;
    uint256 public totalZazuBought;
    uint256 public totalZazuBurned;
    uint256 public totalFeeAssetRescued;

    bool public configurationTimelockEnabled;
    uint48 public configurationDelay;

    struct PendingAddressChange {
        address value;
        uint48 executableAt;
    }

    struct PendingProtectedRescue {
        address token;
        address recipient;
        uint256 amount;
        uint48 executableAt;
    }

    PendingAddressChange public pendingRouterChange;
    PendingAddressChange public pendingDestinationChange;
    PendingProtectedRescue public pendingProtectedRescue;

    event FeesReceived(address indexed sender, address indexed asset, uint256 amount);
    event BuybackExecuted(
        uint256 indexed executionId,
        address indexed inputAsset,
        uint256 amountIn,
        uint256 zazuReceived,
        address indexed destination,
        uint256 timestamp
    );
    event DirectZazuBurned(uint256 amount, address indexed destination, uint256 timestamp);
    event KeeperUpdated(address oldKeeper, address newKeeper);
    event RouterUpdated(address oldRouter, address newRouter);
    event DestinationUpdated(address oldDestination, address newDestination);
    event ExecutionLimitsUpdated(uint256 minimumAmount, uint256 maximumAmount);
    event SlippageUpdated(uint256 maximumSlippageBps);
    event ConfigurationTimelockEnabled(uint48 delay);
    event RouterUpdateScheduled(
        address indexed oldRouter, address indexed newRouter, uint48 executableAt
    );
    event DestinationUpdateScheduled(
        address indexed oldDestination, address indexed newDestination, uint48 executableAt
    );
    event PendingRouterUpdateCancelled(address indexed pendingRouter);
    event PendingDestinationUpdateCancelled(address indexed pendingDestination);
    event UnsupportedTokenRescued(address indexed token, address indexed recipient, uint256 amount);
    event UnsupportedNativeRescued(address indexed recipient, uint256 amount);
    event ProtectedRescueScheduled(
        address indexed token, address indexed recipient, uint256 amount, uint48 executableAt
    );
    event ProtectedTokenRescued(address indexed token, address indexed recipient, uint256 amount);
    event PendingProtectedRescueCancelled(address indexed token, address indexed recipient);

    error UnauthorizedKeeper(address caller);
    error ZeroAddress();
    error InvalidFeeToken();
    error InvalidAmount();
    error InvalidExecutionLimits();
    error InvalidSlippage();
    error IntervalNotElapsed(uint256 nextEligibleTime);
    error InsufficientTreasuryBalance(uint256 available, uint256 requested);
    error RouterNotConfigured();
    error RouterCallFailed(bytes reason);
    error IncorrectInputAmountSpent(uint256 expected, uint256 actual);
    error InsufficientZazuReceived(uint256 received, uint256 minimumRequired);
    error TimelockAlreadyEnabled();
    error TimelockNotEnabled();
    error InvalidTimelockDelay();
    error NoPendingChange();
    error TimelockNotElapsed(uint48 executableAt);
    error ProtectedAsset();
    error NotProtectedAsset();
    error NativeTransferFailed();
    error TreasuryAccountingDeficit(uint256 accountedBalance, uint256 actualBalance);
    error BurnDestinationNotActive(address destination);

    modifier onlyKeeper() {
        if (msg.sender != keeper) revert UnauthorizedKeeper(msg.sender);
        _;
    }

    constructor(
        address initialOwner,
        address zazuToken_,
        address dexRouter_,
        address wrappedNativeToken_,
        address feeToken_,
        address buybackDestination_,
        address keeper_,
        uint256 minimumExecutionAmount_,
        uint256 maximumExecutionAmount_,
        uint256 maximumSlippageBps_
    ) Ownable(initialOwner) {
        if (
            initialOwner == address(0) || zazuToken_ == address(0)
                || wrappedNativeToken_ == address(0) || buybackDestination_ == address(0)
                || keeper_ == address(0)
        ) revert ZeroAddress();
        if (feeToken_ == zazuToken_) revert InvalidFeeToken();

        zazuToken = IERC20(zazuToken_);
        wrappedNativeToken = wrappedNativeToken_;
        feeToken = feeToken_;
        dexRouter = dexRouter_;
        buybackDestination = buybackDestination_;
        keeper = keeper_;
        lastExecutionTime = block.timestamp;

        _setExecutionLimits(minimumExecutionAmount_, maximumExecutionAmount_);
        _setMaximumSlippageBps(maximumSlippageBps_);
    }

    receive() external payable {
        if (feeToken != address(0)) revert InvalidFeeToken();
        if (msg.value == 0) revert InvalidAmount();

        totalDeposited += msg.value;
        emit FeesReceived(msg.sender, address(0), msg.value);
    }

    /// @notice Deposits the configured ERC-20 fee asset. Fee-on-transfer assets are accounted by
    ///         their actual balance delta, not the requested transfer amount.
    function depositERC20(uint256 amount) external nonReentrant {
        address asset = feeToken;
        if (asset == address(0)) revert InvalidFeeToken();
        if (amount == 0) revert InvalidAmount();

        IERC20 token = IERC20(asset);
        uint256 balanceBefore = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = token.balanceOf(address(this)) - balanceBefore;
        if (received == 0) revert InvalidAmount();

        totalDeposited += received;
        emit FeesReceived(msg.sender, asset, received);
    }

    /// @notice Returns the spendable balance of the configured treasury asset.
    function availableTreasuryBalance() public view returns (uint256) {
        if (feeToken == address(0)) return address(this).balance;
        return IERC20(feeToken).balanceOf(address(this));
    }

    /// @notice Accounts fee tokens transferred directly to the vault rather than through
    ///         `depositERC20`. Execution calls this automatically.
    /// @dev `sender = address(0)` denotes a balance-delta sync because ERC-20 transfers do not
    ///      expose the original sender to the receiving contract.
    function syncTreasuryBalance() public returns (uint256 newlyAccounted) {
        uint256 accountedBalance = totalDeposited - totalInputSpent - totalFeeAssetRescued;
        uint256 actualBalance = availableTreasuryBalance();
        if (actualBalance < accountedBalance) {
            revert TreasuryAccountingDeficit(accountedBalance, actualBalance);
        }
        newlyAccounted = actualBalance - accountedBalance;
        if (newlyAccounted != 0) {
            totalDeposited += newlyAccounted;
            emit FeesReceived(address(0), feeToken, newlyAccounted);
        }
    }

    /// @notice Executes one bounded buyback through the configured router.
    /// @param amountIn Exact amount of the configured fee asset the router must consume.
    /// @param minimumZazuOut Minimum acceptable ZAZU balance increase, quoted off-chain.
    /// @param routerData Route data interpreted only by the configured, verified DEX adapter.
    function executeBuyback(uint256 amountIn, uint256 minimumZazuOut, bytes calldata routerData)
        external
        onlyKeeper
        whenNotPaused
        nonReentrant
    {
        address destination = buybackDestination;
        address router = dexRouter;
        if (destination == address(0)) revert ZeroAddress();
        if (router == address(0)) revert RouterNotConfigured();
        if (minimumZazuOut == 0) revert InvalidAmount();
        if (amountIn < minimumExecutionAmount || amountIn > maximumExecutionAmount) {
            revert InvalidAmount();
        }

        uint256 nextEligibleTime = lastExecutionTime + minimumInterval;
        if (block.timestamp < nextEligibleTime) revert IntervalNotElapsed(nextEligibleTime);

        syncTreasuryBalance();
        uint256 inputBalanceBefore = availableTreasuryBalance();
        if (amountIn > inputBalanceBefore) {
            revert InsufficientTreasuryBalance(inputBalanceBefore, amountIn);
        }
        if (totalInputSpent + amountIn > totalDeposited) {
            revert InsufficientTreasuryBalance(totalDeposited - totalInputSpent, amountIn);
        }

        uint256 zazuBalanceBefore = zazuToken.balanceOf(address(this));

        // Effects are committed before calling the configured router. A later revert restores them.
        lastExecutionTime = block.timestamp;
        uint256 executionId = ++executionCount;
        totalInputSpent += amountIn;

        if (feeToken == address(0)) {
            try IDexAdapter(router).swap{ value: amountIn }(
                address(0), address(zazuToken), amountIn, minimumZazuOut, address(this), routerData
            ) returns (
                uint256
            ) { }
            catch (bytes memory reason) {
                revert RouterCallFailed(reason);
            }
        } else {
            IERC20 inputToken = IERC20(feeToken);
            inputToken.forceApprove(router, amountIn);
            try IDexAdapter(router)
                .swap(
                    feeToken,
                    address(zazuToken),
                    amountIn,
                    minimumZazuOut,
                    address(this),
                    routerData
                ) returns (
                uint256
            ) {
                inputToken.forceApprove(router, 0);
            } catch (bytes memory reason) {
                revert RouterCallFailed(reason);
            }
        }

        uint256 inputBalanceAfter = availableTreasuryBalance();
        uint256 actualInputSpent =
            inputBalanceBefore > inputBalanceAfter ? inputBalanceBefore - inputBalanceAfter : 0;
        if (actualInputSpent != amountIn) {
            revert IncorrectInputAmountSpent(amountIn, actualInputSpent);
        }

        uint256 zazuReceived = zazuToken.balanceOf(address(this)) - zazuBalanceBefore;
        if (zazuReceived < minimumZazuOut) {
            revert InsufficientZazuReceived(zazuReceived, minimumZazuOut);
        }

        totalZazuBought += zazuReceived;
        if (destination == DEFAULT_BURN_ADDRESS) totalZazuBurned += zazuReceived;
        zazuToken.safeTransfer(destination, zazuReceived);

        emit BuybackExecuted(
            executionId, feeToken, amountIn, zazuReceived, destination, block.timestamp
        );
    }

    /// @notice Burns token-side pons creator fees that arrive directly at the vault.
    /// @dev Anyone may call this, but it can only transfer ZAZU to the canonical burn address.
    function burnDirectZazu() external whenNotPaused nonReentrant returns (uint256 amount) {
        address destination = buybackDestination;
        if (destination != DEFAULT_BURN_ADDRESS) {
            revert BurnDestinationNotActive(destination);
        }

        amount = zazuToken.balanceOf(address(this));
        if (amount == 0) return 0;

        totalZazuBurned += amount;
        zazuToken.safeTransfer(destination, amount);
        emit DirectZazuBurned(amount, destination, block.timestamp);
    }

    function setKeeper(address newKeeper) external onlyOwner {
        if (newKeeper == address(0)) revert ZeroAddress();
        address oldKeeper = keeper;
        keeper = newKeeper;
        emit KeeperUpdated(oldKeeper, newKeeper);
    }

    /// @notice Applies immediately before the optional timelock is enabled, otherwise schedules.
    function setDexRouter(address newRouter) external onlyOwner {
        if (newRouter == address(0)) revert ZeroAddress();
        if (configurationTimelockEnabled) {
            uint48 executableAt = uint48(block.timestamp) + configurationDelay;
            pendingRouterChange = PendingAddressChange(newRouter, executableAt);
            emit RouterUpdateScheduled(dexRouter, newRouter, executableAt);
        } else {
            _setDexRouter(newRouter);
        }
    }

    /// @notice Applies immediately before the optional timelock is enabled, otherwise schedules.
    function setBuybackDestination(address newDestination) external onlyOwner {
        if (newDestination == address(0)) revert ZeroAddress();
        if (configurationTimelockEnabled) {
            uint48 executableAt = uint48(block.timestamp) + configurationDelay;
            pendingDestinationChange = PendingAddressChange(newDestination, executableAt);
            emit DestinationUpdateScheduled(buybackDestination, newDestination, executableAt);
        } else {
            _setBuybackDestination(newDestination);
        }
    }

    function executeDexRouterUpdate() external onlyOwner {
        PendingAddressChange memory pending = pendingRouterChange;
        if (pending.value == address(0)) revert NoPendingChange();
        if (block.timestamp < pending.executableAt) {
            revert TimelockNotElapsed(pending.executableAt);
        }
        delete pendingRouterChange;
        _setDexRouter(pending.value);
    }

    function executeBuybackDestinationUpdate() external onlyOwner {
        PendingAddressChange memory pending = pendingDestinationChange;
        if (pending.value == address(0)) revert NoPendingChange();
        if (block.timestamp < pending.executableAt) {
            revert TimelockNotElapsed(pending.executableAt);
        }
        delete pendingDestinationChange;
        _setBuybackDestination(pending.value);
    }

    function cancelPendingDexRouterUpdate() external onlyOwner {
        address value = pendingRouterChange.value;
        if (value == address(0)) revert NoPendingChange();
        delete pendingRouterChange;
        emit PendingRouterUpdateCancelled(value);
    }

    function cancelPendingBuybackDestinationUpdate() external onlyOwner {
        address value = pendingDestinationChange.value;
        if (value == address(0)) revert NoPendingChange();
        delete pendingDestinationChange;
        emit PendingDestinationUpdateCancelled(value);
    }

    function setExecutionLimits(uint256 minAmount, uint256 maxAmount) external onlyOwner {
        _setExecutionLimits(minAmount, maxAmount);
    }

    function setMaximumSlippageBps(uint256 newMaximumSlippageBps) external onlyOwner {
        _setMaximumSlippageBps(newMaximumSlippageBps);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        PendingProtectedRescue memory pending = pendingProtectedRescue;
        if (pending.recipient != address(0)) {
            delete pendingProtectedRescue;
            emit PendingProtectedRescueCancelled(pending.token, pending.recipient);
        }
        _unpause();
    }

    /// @notice One-way switch that timelocks all later router and destination updates.
    function enableConfigurationTimelock(uint48 delay) external onlyOwner {
        if (configurationTimelockEnabled) revert TimelockAlreadyEnabled();
        if (delay < MINIMUM_CONFIGURATION_DELAY) revert InvalidTimelockDelay();
        configurationTimelockEnabled = true;
        configurationDelay = delay;
        emit ConfigurationTimelockEnabled(delay);
    }

    /// @notice Rescues an unrelated ERC-20 sent by mistake while operations are paused.
    /// @dev ZAZU and the configured fee asset require the separate protected rescue timelock.
    function rescueUnsupportedToken(address token, address recipient)
        external
        onlyOwner
        whenPaused
    {
        if (token == address(0) || recipient == address(0)) revert ZeroAddress();
        if (_isProtectedAsset(token)) revert ProtectedAsset();

        uint256 amount = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(recipient, amount);
        emit UnsupportedTokenRescued(token, recipient, amount);
    }

    /// @notice Recovers native currency forced into an ERC-20 fee vault.
    /// @dev Native currency is protected treasury when `feeToken == address(0)` and must use the
    ///      separately timelocked protected rescue path instead.
    function rescueUnsupportedNative(address recipient) external onlyOwner whenPaused nonReentrant {
        if (recipient == address(0)) revert ZeroAddress();
        if (feeToken == address(0)) revert ProtectedAsset();

        uint256 amount = address(this).balance;
        if (amount == 0) revert InvalidAmount();
        (bool success,) = recipient.call{ value: amount }("");
        if (!success) revert NativeTransferFailed();
        emit UnsupportedNativeRescued(recipient, amount);
    }

    /// @notice Schedules an emergency recovery of ZAZU or the fee asset while paused.
    function scheduleProtectedTokenRescue(address token, address recipient)
        external
        onlyOwner
        whenPaused
    {
        if (!configurationTimelockEnabled) revert TimelockNotEnabled();
        if (recipient == address(0)) revert ZeroAddress();
        if (!_isProtectedAsset(token)) revert NotProtectedAsset();

        uint48 executableAt = uint48(block.timestamp) + configurationDelay;
        uint256 amount =
            token == address(0) ? address(this).balance : IERC20(token).balanceOf(address(this));
        if (amount == 0) revert InvalidAmount();
        pendingProtectedRescue = PendingProtectedRescue(token, recipient, amount, executableAt);
        emit ProtectedRescueScheduled(token, recipient, amount, executableAt);
    }

    function executeProtectedTokenRescue() external onlyOwner whenPaused nonReentrant {
        PendingProtectedRescue memory pending = pendingProtectedRescue;
        if (pending.recipient == address(0)) revert NoPendingChange();
        if (block.timestamp < pending.executableAt) {
            revert TimelockNotElapsed(pending.executableAt);
        }
        delete pendingProtectedRescue;

        // Include direct ERC-20 transfers made after scheduling before rescuing the fee asset.
        if (pending.token == feeToken) syncTreasuryBalance();

        uint256 amount = pending.amount;
        if (pending.token == address(0)) {
            if (pending.token == feeToken) totalFeeAssetRescued += amount;
            (bool success,) = pending.recipient.call{ value: amount }("");
            if (!success) revert NativeTransferFailed();
        } else {
            IERC20 token = IERC20(pending.token);
            if (pending.token == feeToken) totalFeeAssetRescued += amount;
            token.safeTransfer(pending.recipient, amount);
        }
        emit ProtectedTokenRescued(pending.token, pending.recipient, amount);
    }

    function cancelPendingProtectedTokenRescue() external onlyOwner {
        PendingProtectedRescue memory pending = pendingProtectedRescue;
        if (pending.recipient == address(0)) revert NoPendingChange();
        delete pendingProtectedRescue;
        emit PendingProtectedRescueCancelled(pending.token, pending.recipient);
    }

    function _setDexRouter(address newRouter) internal {
        address oldRouter = dexRouter;
        dexRouter = newRouter;
        emit RouterUpdated(oldRouter, newRouter);
    }

    function _setBuybackDestination(address newDestination) internal {
        address oldDestination = buybackDestination;
        buybackDestination = newDestination;
        emit DestinationUpdated(oldDestination, newDestination);
    }

    function _setExecutionLimits(uint256 minAmount, uint256 maxAmount) internal {
        if (minAmount == 0 || maxAmount < minAmount) revert InvalidExecutionLimits();
        minimumExecutionAmount = minAmount;
        maximumExecutionAmount = maxAmount;
        emit ExecutionLimitsUpdated(minAmount, maxAmount);
    }

    function _setMaximumSlippageBps(uint256 newMaximumSlippageBps) internal {
        if (newMaximumSlippageBps == 0 || newMaximumSlippageBps > MAXIMUM_ALLOWED_SLIPPAGE_BPS) {
            revert InvalidSlippage();
        }
        maximumSlippageBps = newMaximumSlippageBps;
        emit SlippageUpdated(newMaximumSlippageBps);
    }

    function _isProtectedAsset(address token) internal view returns (bool) {
        return token == address(zazuToken) || token == feeToken;
    }
}
