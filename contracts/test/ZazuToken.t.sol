// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Test } from "forge-std/Test.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ZazuToken } from "../src/ZazuToken.sol";

contract ZazuTokenTest is Test {
    address internal owner = makeAddr("owner");
    address internal nextOwner = makeAddr("nextOwner");
    address internal recipient = makeAddr("recipient");
    ZazuToken internal token;

    function setUp() public {
        token = new ZazuToken(owner, recipient, 1_000_000_000 ether);
    }

    function testFixedSupplyHasNoMintPath() public view {
        assertEq(token.name(), "Zazu Cat");
        assertEq(token.symbol(), "ZAZU");
        assertEq(token.totalSupply(), 1_000_000_000 ether);
        assertEq(token.initialSupply(), 1_000_000_000 ether);
        assertEq(token.balanceOf(recipient), token.totalSupply());
    }

    function testRejectsZeroSupplyOrRecipient() public {
        vm.expectRevert(ZazuToken.ZeroAddress.selector);
        new ZazuToken(owner, address(0), 1 ether);

        vm.expectRevert(ZazuToken.ZeroSupply.selector);
        new ZazuToken(owner, recipient, 0);
    }

    function testOwnershipTransferIsTwoStep() public {
        vm.prank(owner);
        token.transferOwnership(nextOwner);
        assertEq(token.owner(), owner);
        assertEq(token.pendingOwner(), nextOwner);

        vm.prank(nextOwner);
        token.acceptOwnership();
        assertEq(token.owner(), nextOwner);
    }

    function testRenouncementRequiresExplicitOneWayEnable() public {
        vm.prank(owner);
        vm.expectRevert(ZazuToken.OwnershipRenouncementNotEnabled.selector);
        token.renounceOwnership();

        vm.startPrank(owner);
        token.enableOwnershipRenouncement();
        token.renounceOwnership();
        vm.stopPrank();
        assertEq(token.owner(), address(0));
    }

    function testNonOwnerCannotEnableRenouncement() public {
        vm.prank(nextOwner);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, nextOwner)
        );
        token.enableOwnershipRenouncement();
    }
}
