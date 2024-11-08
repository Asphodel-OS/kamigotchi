// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";

contract AccItemsTest is SetupTemplate {
  uint32 petFoodIndex = 998;
  uint32 petTeleportIndex = 997;
  uint32 wrongTypeItemIndex = 999;

  function setUpItems() public override {
    // wrong pet consumables
    vm.startPrank(deployer);
    __ItemRegistrySystem.createConsumable(
      abi.encode(petFoodIndex, "KAMI", "name", "description", "FOOD", "media")
    );
    vm.startPrank(deployer);
    __ItemRegistrySystem.createConsumable(
      abi.encode(petTeleportIndex, "KAMI", "name", "description", "TELEPORT", "media")
    );
    // wrong type consumable
    __ItemRegistrySystem.createConsumable(
      abi.encode(wrongTypeItemIndex, "ACCOUNT", "name", "description", "WRONG_TYPE", "media")
    );
    vm.stopPrank();
  }

  function testAccItemFeed() public {
    uint32 itemIndex = 1;
    vm.startPrank(deployer);
    __ItemRegistrySystem.createConsumable(
      abi.encode(itemIndex, "ACCOUNT", "name", "description", "FOOD", "media")
    );
    __ItemRegistrySystem.addStat(itemIndex, "STAMINA", 3);
    vm.stopPrank();
    _giveItem(alice, itemIndex, 1);

    // testing item checks
    assertTypeAndFor(_AccountUseFoodSystem, petFoodIndex);

    // setting stamina
    vm.startPrank(deployer);
    _StaminaComponent.set(alice.id, Stat(20, 0, 0, 20));
    LibAccount.syncStamina(components, alice.id);
    int32 start = 15;
    _StaminaComponent.set(alice.id, Stat(20, 0, 0, start));
    vm.stopPrank();

    // using item
    vm.prank(alice.operator);
    _AccountUseFoodSystem.executeTyped(itemIndex);
    assertEq(_StaminaComponent.get(alice.id).sync, start + 3);
  }

  function testAccItemTeleport() public {
    uint32 itemIndex = 1;
    uint32 room = 11;
    vm.startPrank(deployer);
    __ItemRegistrySystem.createConsumable(
      abi.encode(itemIndex, "ACCOUNT", "name", "description", "TELEPORT", "media")
    );
    __ItemRegistrySystem.setRoom(itemIndex, room);
    vm.stopPrank();
    _giveItem(alice, itemIndex, 1);

    // testing item checks
    assertTypeAndFor(_AccountUseTeleportSystem, petTeleportIndex);

    // using item
    vm.prank(alice.operator);
    _AccountUseTeleportSystem.executeTyped(itemIndex);
    assertEq(_IndexRoomComponent.get(alice.id), room);
  }

  /////////////////
  // UTILS

  function assertTypeAndFor(ISystem system, uint32 wrongItem) public {
    vm.prank(alice.operator);
    vm.expectRevert("that's not for accounts");
    system.execute(abi.encode(wrongItem));

    vm.prank(alice.operator);
    vm.expectRevert(); // could be different type errors
    system.execute(abi.encode(wrongTypeItemIndex));
  }
}
