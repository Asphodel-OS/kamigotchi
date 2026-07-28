// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "./Item.t.sol";

/// @notice KamiCastItemSystem coverage: for-shapes, target state and ownership gates
contract ItemCastTest is ItemTemplate {
  uint32 constant ENEMY_ITEM = 211; // ENEMY_KAMI shape (e.g. spirit glue)
  uint32 constant ANY_ITEM = 212; // ANY_KAMI shape (e.g. flash talisman)
  uint32 constant SELF_ITEM = 213; // KAMI shape (self-use only)

  function setUp() public override {
    super.setUp();
    _createCastable(ENEMY_ITEM, "ENEMY_KAMI", "BONUS_ENEMY");
    _createCastable(ANY_ITEM, "ANY_KAMI", "BONUS_ANY");
    _createCastable(SELF_ITEM, "KAMI", "BONUS_SELF");

    _giveItem(alice, ENEMY_ITEM, 10);
    _giveItem(alice, ANY_ITEM, 10);
    _giveItem(alice, SELF_ITEM, 10);
  }

  function _createCastable(
    uint32 index,
    string memory forShape,
    string memory bonusType
  ) internal returns (uint256 id) {
    vm.startPrank(deployer);
    id = __ItemRegistrySystem.createConsumable(
      abi.encode(index, forShape, "name", "description", "POTION", "media")
    );
    __ItemRegistrySystem.addAlloBonus(
      abi.encode(index, "USE", bonusType, "UPON_KILL_OR_KILLED", 0, 1)
    );
    vm.stopPrank();
  }

  /////////////////
  // CAST (enemy path)

  function testCastOnHarvestingEnemy() public {
    uint256 targetID = _mintKami(bob);
    _startHarvest(targetID, 1);

    vm.prank(alice.operator);
    _KamiCastItemSystem.executeTyped(targetID, ENEMY_ITEM);
    assertEq(LibBonus.getFor(components, "BONUS_ENEMY", targetID), 1);
    assertEq(LibInventory.getBalanceOf(components, alice.id, ENEMY_ITEM), 9);

    // ANY_KAMI shape casts on enemies too
    vm.prank(alice.operator);
    _KamiCastItemSystem.executeTyped(targetID, ANY_ITEM);
    assertEq(LibBonus.getFor(components, "BONUS_ANY", targetID), 1);
    assertEq(LibInventory.getBalanceOf(components, alice.id, ANY_ITEM), 9);
  }

  function testCastRevertsOnRestingEnemy() public {
    uint256 targetID = _mintKami(bob); // resting: not exposed on a node

    vm.prank(alice.operator);
    vm.expectRevert("kami not HARVESTING");
    _KamiCastItemSystem.executeTyped(targetID, ENEMY_ITEM);

    vm.prank(alice.operator);
    vm.expectRevert("kami not HARVESTING");
    _KamiCastItemSystem.executeTyped(targetID, ANY_ITEM);
  }

  function testCastRevertsOnOwnKami() public {
    uint256 kamiID = _mintKami(alice);
    _startHarvest(kamiID, 1);

    // own kamis are unreachable through cast, whatever the item shape
    vm.prank(alice.operator);
    vm.expectRevert("cannot cast on own kami");
    _KamiCastItemSystem.executeTyped(kamiID, ENEMY_ITEM);

    vm.prank(alice.operator);
    vm.expectRevert("cannot cast on own kami");
    _KamiCastItemSystem.executeTyped(kamiID, ANY_ITEM);
  }

  function testCastRevertsOnSelfShapedItem() public {
    uint256 targetID = _mintKami(bob);
    _startHarvest(targetID, 1);

    vm.prank(alice.operator);
    vm.expectRevert("not for ENEMY_KAMI or ANY_KAMI");
    _KamiCastItemSystem.executeTyped(targetID, SELF_ITEM);
  }

  /////////////////
  // USE (self path)

  function testUseAnyKamiOnOwn() public {
    uint256 kamiID = _mintKami(alice);

    // ANY_KAMI self-buffs through the use path
    vm.prank(alice.operator);
    _KamiUseItemSystem.executeTyped(kamiID, ANY_ITEM);
    assertEq(LibBonus.getFor(components, "BONUS_ANY", kamiID), 1);
    assertEq(LibInventory.getBalanceOf(components, alice.id, ANY_ITEM), 9);

    // KAMI shape still works
    vm.prank(alice.operator);
    _KamiUseItemSystem.executeTyped(kamiID, SELF_ITEM);
    assertEq(LibBonus.getFor(components, "BONUS_SELF", kamiID), 1);
  }

  function testUseRevertsOnEnemyShapedItem() public {
    uint256 kamiID = _mintKami(alice);

    vm.prank(alice.operator);
    vm.expectRevert("not for KAMI or ANY_KAMI");
    _KamiUseItemSystem.executeTyped(kamiID, ENEMY_ITEM);
  }
}
