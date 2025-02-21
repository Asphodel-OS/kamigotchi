// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "./Item.t.sol";

contract ItemAccountTest is ItemTemplate {
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

  function testItemAccFeed() public {
    uint32 itemIndex = 1;
    vm.startPrank(deployer);
    __ItemRegistrySystem.createConsumable(
      abi.encode(itemIndex, "ACCOUNT", "name", "description", "FOOD", "media")
    );
    __ItemRegistrySystem.addAlloStat(abi.encode(itemIndex, "USE", "STAMINA", 0, 0, 0, 3));
    vm.stopPrank();
    _giveItem(alice, itemIndex, 1);

    // testing item checks
    assertTypeAndFor(_AccountUseItemSystem, petFoodIndex);

    // setting stamina
    vm.startPrank(deployer);
    _StaminaComponent.set(alice.id, Stat(20, 0, 0, 20));
    LibAccount.sync(components, alice.id);
    int32 start = 15;
    _StaminaComponent.set(alice.id, Stat(20, 0, 0, start));
    vm.stopPrank();

    // using item
    vm.prank(alice.operator);
    _AccountUseItemSystem.executeTyped(itemIndex, 1);
    assertEq(_StaminaComponent.get(alice.id).sync, start + 3);
  }

  function testItemAccTeleport() public {
    uint32 itemIndex = 1;
    uint32 room = 11;
    vm.startPrank(deployer);
    __ItemRegistrySystem.createConsumable(
      abi.encode(itemIndex, "ACCOUNT", "name", "description", "TELEPORT", "media")
    );
    __ItemRegistrySystem.addAlloBasic(abi.encode(itemIndex, "USE", "ROOM", room, 0));
    vm.stopPrank();
    _giveItem(alice, itemIndex, 1);

    // testing item checks
    assertTypeAndFor(_AccountUseItemSystem, petTeleportIndex);

    // using item
    vm.prank(alice.operator);
    _AccountUseItemSystem.executeTyped(itemIndex, 1);
    assertEq(_IndexRoomComponent.get(alice.id), room);
  }

  /////////////////
  // UTILS

  function assertTypeAndFor(ISystem system, uint32 wrongItem) public {
    vm.prank(alice.operator);
    vm.expectRevert("not for ACCOUNT");
    system.execute(abi.encode(wrongItem, 1));

    vm.prank(alice.operator);
    vm.expectRevert(); // could be different type errors
    system.execute(abi.encode(wrongTypeItemIndex, 1));
  }
}
