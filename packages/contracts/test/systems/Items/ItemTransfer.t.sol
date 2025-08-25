// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "./Item.t.sol";

contract ItemTransferTest is ItemTemplate {
  function testTransferBasic() public {
    uint32 itemA = 1;
    uint32 itemB = 2;
    _giveItem(alice, itemA, 3);

    // transfer to bob
    _transfer(alice, bob, itemA, 1);

    // check balances
    assertEq(_getItemBal(alice, itemA), 2);
    assertEq(_getItemBal(bob, itemA), 1);

    // transfer multiple
    _giveItem(alice, itemB, 5);
    uint32[] memory itemIndices = new uint32[](2);
    itemIndices[0] = itemA;
    itemIndices[1] = itemB;
    uint256[] memory amts = new uint256[](2);
    amts[0] = 1;
    amts[1] = 2;
    _transfer(alice, bob, itemIndices, amts);

    // check balances
    assertEq(_getItemBal(alice, itemA), 1);
    assertEq(_getItemBal(bob, itemA), 2);
    assertEq(_getItemBal(alice, itemB), 3);
    assertEq(_getItemBal(bob, itemB), 2);
  }

  ////////////////////
  // UTILS

  function _transfer(
    PlayerAccount memory from,
    PlayerAccount memory to,
    uint32 itemIndex,
    uint256 amt
  ) internal {
    uint32[] memory itemIndices = new uint32[](1);
    itemIndices[0] = itemIndex;
    uint256[] memory amts = new uint256[](1);
    amts[0] = amt;
    _transfer(from, to, itemIndices, amts);
  }

  function _transfer(
    PlayerAccount memory from,
    PlayerAccount memory to,
    uint32[] memory itemIndices,
    uint256[] memory amts
  ) internal {
    vm.prank(from.owner);
    _ItemTransferSystem.executeTyped(itemIndices, amts, to.id);
  }
}
