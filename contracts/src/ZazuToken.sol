// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Ownable2Step } from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title Zazu Cat
/// @notice Fixed-supply ERC-20 with no minting, blacklist, transfer tax, or transfer restrictions.
contract ZazuToken is ERC20, Ownable2Step {
    uint256 public immutable initialSupply;

    bool public ownershipRenouncementEnabled;

    event OwnershipRenouncementEnabled();

    error OwnershipRenouncementNotEnabled();
    error ZeroAddress();
    error ZeroSupply();

    constructor(address initialOwner, address tokenRecipient, uint256 fixedSupply)
        ERC20("Zazu Cat", "ZAZU")
        Ownable(initialOwner)
    {
        if (tokenRecipient == address(0)) revert ZeroAddress();
        if (fixedSupply == 0) revert ZeroSupply();
        initialSupply = fixedSupply;
        _mint(tokenRecipient, fixedSupply);
    }

    /// @notice Permanently enables ownership renouncement after launch configuration is complete.
    function enableOwnershipRenouncement() external onlyOwner {
        if (!ownershipRenouncementEnabled) {
            ownershipRenouncementEnabled = true;
            emit OwnershipRenouncementEnabled();
        }
    }

    /// @dev Renouncement is disabled by default to prevent accidental loss during configuration.
    function renounceOwnership() public override onlyOwner {
        if (!ownershipRenouncementEnabled) revert OwnershipRenouncementNotEnabled();
        super.renounceOwnership();
    }
}
