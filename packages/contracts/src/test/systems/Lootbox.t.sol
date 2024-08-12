// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";

// this test experience gain, leveling and all expected effects due to leveling
contract LootboxTest is SetupTemplate {
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
    uint32 lootboxIndex = 10;
    _createBlankLootbox(lootboxIndex);

    _giveLootbox(alice, lootboxIndex, startAmt);
    assertEq(_getItemBal(alice, lootboxIndex), startAmt);

    if (useAmt > 10) {
      vm.startPrank(alice.operator);
      vm.expectRevert("LootboxStartReveal: max 10");
      _LootboxCommitSystem.executeTyped(lootboxIndex, useAmt);

      assertEq(_getItemBal(alice, lootboxIndex), startAmt);
    } else if (useAmt > startAmt) {
      vm.startPrank(alice.operator);
      // vm.expectRevert("Inventory: insufficient balance");
      vm.expectRevert();
      _LootboxCommitSystem.executeTyped(lootboxIndex, useAmt);

      assertEq(_getItemBal(alice, lootboxIndex), startAmt);
    } else {
      vm.roll(_currBlock);
      vm.prank(alice.operator);
      uint256 revealID = abi.decode(
        _LootboxCommitSystem.executeTyped(lootboxIndex, useAmt),
        (uint256)
      );
      _assertCommit(revealID, alice.id, lootboxIndex, _currBlock, useAmt);

      vm.roll(++_currBlock);
      uint256[] memory revealIDs = new uint256[](1);
      revealIDs[0] = revealID;
      vm.prank(alice.operator);
      _DroptableRevealSystem.executeTyped(revealIDs);

      assertEq(_getItemBal(0, 1), useAmt);
      assertEq(_getItemBal(0, lootboxIndex), startAmt - useAmt);
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
    _giveLootbox(alice, lootboxIndex, 5);
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
    _giveLootbox(alice, lootboxIndex, 25);

    revealIDs[0] = _openLootbox(alice, lootboxIndex, 1);
    revealIDs[1] = _openLootbox(alice, lootboxIndex, 2);
    revealIDs[2] = _openLootbox(alice, lootboxIndex, 4);
    revealIDs[3] = _openLootbox(alice, lootboxIndex, 8);
    revealIDs[4] = _openLootbox(alice, lootboxIndex, 10);

    vm.prank(alice.operator);
    _DroptableRevealSystem.executeTyped(revealIDs);

    assertEq(_getItemBal(alice, 1), 25);
  }

  function testLootboxExpired() public {
    uint32 lootboxIndex = 10;
    _createBlankLootbox(lootboxIndex);
    uint256[] memory revealIDs = new uint256[](1);
    _giveLootbox(alice, lootboxIndex, 1);

    revealIDs[0] = _openLootbox(alice, lootboxIndex, 1);
    vm.roll(_currBlock += 300);

    vm.prank(alice.operator);
    vm.expectRevert("Blockhash unavailable. Contact admin");
    _DroptableRevealSystem.executeTyped(revealIDs);
  }

  function testLootboxForceReveal() public {
    uint32 lootboxIndex = 10;
    _createBlankLootbox(lootboxIndex);
    _giveLootbox(alice, lootboxIndex, 1);
    uint256 revealID = _openLootbox(alice, lootboxIndex, 1);

    // try while still valid
    vm.prank(deployer);
    vm.expectRevert("LootboxExeRev: commit still available");
    _DroptableRevealSystem.forceReveal(revealID);

    // roll
    vm.roll(_currBlock += 300);

    // try unauthorized
    vm.prank(alice.operator);
    vm.expectRevert("Auth: not a community manager");
    _DroptableRevealSystem.forceReveal(revealID);

    // authorized call
    vm.prank(deployer);
    _DroptableRevealSystem.forceReveal(revealID);

    assertEq(_getItemBal(alice, 1), 1);
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

  function _giveLootbox(PlayerAccount memory player, uint32 index, uint256 amt) internal {
    vm.startPrank(deployer);
    LibInventory.incFor(components, player.id, index, amt);
    LibInventory.logIncItemTotal(components, player.id, index, amt);
    vm.stopPrank();
  }

  function _openLootbox(
    PlayerAccount memory player,
    uint32 index,
    uint256 amt
  ) internal returns (uint256 id) {
    vm.startPrank(player.operator);
    id = abi.decode(_LootboxCommitSystem.executeTyped(index, amt), (uint256));
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
    assertEq(_ForComponent.get(id), LibItemRegistry.getByIndex(components, index));
    assertEq(_ValueComponent.get(id), count);
    assertEq(_IdHolderComponent.get(id), holderID);
    assertEq(_BlockRevealComponent.get(id), revealBlock);
  }
}
