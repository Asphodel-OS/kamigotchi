// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "./Item.t.sol";

contract LootboxTest is ItemTemplate {
  function setUp() public override {
    super.setUp();

    vm.roll(_currBlock++);
  }

  function setUpItems() public override {
    _createGenericItem(1);
    _createGenericItem(2);
    _createGenericItem(3);
    _createGenericItem(4);
  }

  /////////////////
  // TESTS

  function testLootboxSingle(uint256 startAmt, uint256 useAmt) public {
    vm.assume(startAmt < type(uint16).max);
    vm.assume(useAmt < type(uint16).max);
    uint32 lootboxIndex = 10;
    _createBlankLootbox(lootboxIndex);

    _giveItem(alice, lootboxIndex, startAmt);
    assertEq(_getItemBal(alice, lootboxIndex), startAmt);

    // if (useAmt > 100) {
    //   vm.startPrank(alice.operator);
    //   vm.expectRevert("max 100 item use at once");
    //   _AccountUseItemSystem.executeTyped(lootboxIndex, useAmt);

    //   assertEq(_getItemBal(alice, lootboxIndex), startAmt);
    // } else if (useAmt > startAmt) {
    if (useAmt > startAmt) {
      vm.startPrank(alice.operator);
      // vm.expectRevert("Inventory: insufficient balance");
      vm.expectRevert();
      _AccountUseItemSystem.executeTyped(lootboxIndex, useAmt);

      assertEq(_getItemBal(alice, lootboxIndex), startAmt);
    } else {
      vm.roll(_currBlock);
      uint256 revealID = _openLootbox(alice, lootboxIndex, useAmt);
      _assertCommit(revealID, alice.id, lootboxIndex, _currBlock - 1, useAmt); // curr block got added in _openLootbox

      vm.roll(++_currBlock);
      uint256[] memory revealIDs = new uint256[](1);
      revealIDs[0] = revealID;
      vm.prank(alice.operator);
      _DroptableRevealSystem.executeTyped(revealIDs);

      assertEq(_getItemBal(alice, 1), useAmt);
      assertEq(_getItemBal(alice, lootboxIndex), startAmt - useAmt);
    }
  }

  function testLootboxSingleDT() public {
    uint32 lootboxIndex = 10;
    uint32[] memory keys = new uint32[](4);
    uint256[] memory weights = new uint256[](4);
    for (uint i = 0; i < 4; i++) {
      keys[i] = uint32(i + 1);
      weights[i] = 9;
    }
    _createLootbox(lootboxIndex, "LOOTBOX", keys, weights);

    uint256[] memory revealIDs = new uint256[](1);
    _giveItem(alice, lootboxIndex, 5);
    revealIDs[0] = _openLootbox(alice, lootboxIndex, 5);

    console.log(uint256(blockhash(block.number - 1)));
    vm.prank(alice.operator);
    _DroptableRevealSystem.executeTyped(revealIDs);

    // total items = 5
    assertEq(
      _getItemBal(alice, 1) + _getItemBal(alice, 2) + _getItemBal(alice, 3) + _getItemBal(alice, 4),
      5
    );
  }

  function testLootboxMultiple() public {
    uint32 lootboxIndex = 10;
    _createBlankLootbox(lootboxIndex);
    uint256[] memory revealIDs = new uint256[](5);
    _giveItem(alice, lootboxIndex, 25);

    revealIDs[0] = _openLootbox(alice, lootboxIndex, 1);
    revealIDs[1] = _openLootbox(alice, lootboxIndex, 2);
    revealIDs[2] = _openLootbox(alice, lootboxIndex, 4);
    revealIDs[3] = _openLootbox(alice, lootboxIndex, 8);
    revealIDs[4] = _openLootbox(alice, lootboxIndex, 10);

    vm.prank(alice.operator);
    _DroptableRevealSystem.executeTyped(revealIDs);

    assertEq(_getItemBal(alice, 1), 25);
  }

  /////////////////
  // FUNCTIONS

  function _createBlankLootbox(uint32 index) public {
    uint32[] memory keys = new uint32[](1);
    keys[0] = 1;
    uint256[] memory weights = new uint256[](1);
    weights[0] = 1;

    _createLootbox(index, "Lootbox", keys, weights);
  }

  function _openLootbox(
    PlayerAccount memory player,
    uint32 index,
    uint256 amt
  ) internal returns (uint256 id) {
    vm.startPrank(player.operator);
    id = simGetUniqueEntityId();
    _AccountUseItemSystem.executeTyped(index, amt);
    vm.roll(_currBlock++);
    vm.stopPrank();
  }

  /////////////////
  // ASSERTIONS

  function _assertCommit(
    uint256 id,
    uint256 holderID,
    uint32 index,
    uint256 revealBlock,
    uint256 count
  ) internal {
    assertEq(_ValueComponent.get(id), count, "count mismatch");
    assertEq(_IdHolderComponent.get(id), holderID, "holderID mismatch");
    assertEq(_BlockRevealComponent.get(id), revealBlock, "reveal block mismatch");
  }
}
