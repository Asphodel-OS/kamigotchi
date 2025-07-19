// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "./Item.t.sol";

contract ItemKamiTest is ItemTemplate {
  //todo:
  // 1. test account permissions
  // 2. test revive state
  // 3. test room constraints
  // 4. test cooldown
  // 5. test effects - basic, more detailed testing in allo

  function testItemKamiBonus() public {
    uint32 itemA = 111;
    uint32 itemB = 112;
    uint32 itemC = 113;
    _createConsumable(itemA, "KAMI");
    _createConsumable(itemB, "KAMI");
    _createConsumable(itemC, "KAMI");
    vm.startPrank(deployer);
    __ItemRegistrySystem.addAlloBonus(
      abi.encode(itemA, "USE", "BONUS_1", "UPON_HARVEST_ACTION", 0, 3)
    );
    __ItemRegistrySystem.addAlloBonus(
      abi.encode(itemB, "USE", "BONUS_1", "UPON_HARVEST_ACTION", 0, 5)
    );
    __ItemRegistrySystem.addAlloBonus(
      abi.encode(itemC, "USE", "BONUS_2", "UPON_HARVEST_ACTION", 0, 7)
    );
    __ItemRegistrySystem.addFlag(itemA, "BYPASS_BONUS_RESET");
    __ItemRegistrySystem.addFlag(itemB, "BYPASS_BONUS_RESET");
    __ItemRegistrySystem.addFlag(itemC, "BYPASS_BONUS_RESET");
    vm.stopPrank();

    // alice setup
    uint256 kamiID = _mintKami(alice);
    _giveItem(alice, itemA, 10);
    _giveItem(alice, itemB, 10);
    _giveItem(alice, itemC, 10);

    // use itemA
    vm.prank(alice.operator);
    _KamiUseItemSystem.executeTyped(kamiID, itemA);
    assertEq(LibBonus.getFor(components, "BONUS_1", kamiID), 3);
    assertEq(LibBonus.getFor(components, "BONUS_2", kamiID), 0);

    // use itemA again, should not stack
    vm.prank(alice.operator);
    _KamiUseItemSystem.executeTyped(kamiID, itemA);
    assertEq(LibBonus.getFor(components, "BONUS_1", kamiID), 3);
    assertEq(LibBonus.getFor(components, "BONUS_2", kamiID), 0);

    // use itemB, should stack
    vm.prank(alice.operator);
    _KamiUseItemSystem.executeTyped(kamiID, itemB);
    assertEq(LibBonus.getFor(components, "BONUS_1", kamiID), 8);
    assertEq(LibBonus.getFor(components, "BONUS_2", kamiID), 0);

    // use itemC, should increase BONUS_2
    vm.prank(alice.operator);
    _KamiUseItemSystem.executeTyped(kamiID, itemC);
    assertEq(LibBonus.getFor(components, "BONUS_1", kamiID), 8);
    assertEq(LibBonus.getFor(components, "BONUS_2", kamiID), 7);

    // use itemA again, should not stack
    vm.prank(alice.operator);
    _KamiUseItemSystem.executeTyped(kamiID, itemA);
    assertEq(LibBonus.getFor(components, "BONUS_1", kamiID), 8);
    assertEq(LibBonus.getFor(components, "BONUS_2", kamiID), 7);

    // feeding food, will reset bonuses
    uint32 foodIndex = 114;
    _createFood(foodIndex, "name", "description", 0, 0, "media");
    _giveItem(alice, foodIndex, 10);
    vm.prank(alice.operator);
    _KamiUseItemSystem.executeTyped(kamiID, foodIndex);
    assertEq(LibBonus.getFor(components, "BONUS_1", alice.id), 0);
    assertEq(LibBonus.getFor(components, "BONUS_2", alice.id), 0);
  }
}
