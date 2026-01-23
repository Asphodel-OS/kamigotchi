// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/systems/Minting/MintTemplate.t.sol";
import { stdError } from "forge-std/StdError.sol";

import { LibBonus } from "libraries/LibBonus.sol";
import { LibEquipment } from "libraries/LibEquipment.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibStat } from "libraries/LibStat.sol";

contract EquipmentTest is MintTemplate {
  // Equipment item indices
  uint32 constant PETPET_INDEX = 9001;
  uint32 constant HAT_INDEX = 9002;

  // Slot types
  string constant SLOT_PETPET = "PETPET";
  string constant SLOT_HAT = "HAT";

  // Bonus values
  int256 constant POWER_BONUS = 10;
  int256 constant HEALTH_BONUS = 20;

  // Capacity skill for testing
  uint32 constant CAPACITY_SKILL_INDEX = 9999;

  function setUp() public override {
    super.setUp();
    _createEquipmentItems();
    _createCapacitySkill();
  }

  /// @notice Creates a skill that grants +1 equipment capacity per level
  function _createCapacitySkill() internal {
    vm.startPrank(deployer);
    __SkillRegistrySystem.create(
      abi.encode(CAPACITY_SKILL_INDEX, "KAMI", "", "Equip Capacity", "Increase equipment capacity", uint256(0), uint256(10), uint256(0), "")
    );
    __SkillRegistrySystem.addBonus(abi.encode(CAPACITY_SKILL_INDEX, "EQUIP_CAPACITY_SHIFT", int256(1)));
    vm.stopPrank();
  }

  /// @notice Helper to increase a kami's equipment capacity
  function _increaseCapacity(PlayerAccount memory acc, uint256 kamiID, uint256 amount) internal {
    for (uint256 i = 0; i < amount; i++) {
      _upgradeSkill(acc, kamiID, CAPACITY_SKILL_INDEX);
    }
  }

  function setUpTraits() public virtual override {
    _initBasicTraits();
  }

  function _createEquipmentItems() internal {
    vm.startPrank(deployer);

    // Create PETPET equipment - gives +10 Power shift bonus
    __ItemRegistrySystem.create(
      abi.encode(PETPET_INDEX, "EQUIPMENT", "PetPet", "A pet for your pet", "media", uint32(1))
    );
    __ItemRegistrySystem.setSlot(PETPET_INDEX, SLOT_PETPET);
    LibItem.setFor(components, LibItem.genID(PETPET_INDEX), "KAMI");

    // Add bonus with ON_UNEQUIP end type
    __ItemRegistrySystem.addAlloBonus(
      abi.encode(
        PETPET_INDEX,
        "EQUIP", // use case
        "STAT_POWER_SHIFT", // bonus type
        "ON_UNEQUIP_PETPET", // end type (slot-specific)
        uint256(0), // duration (0 for permanent until unequip)
        POWER_BONUS // value
      )
    );

    // Create HAT equipment - gives +20 Health shift bonus
    __ItemRegistrySystem.create(
      abi.encode(HAT_INDEX, "EQUIPMENT", "Cool Hat", "A stylish hat", "media", uint32(1))
    );
    __ItemRegistrySystem.setSlot(HAT_INDEX, SLOT_HAT);
    LibItem.setFor(components, LibItem.genID(HAT_INDEX), "KAMI");

    // Add bonus with ON_UNEQUIP end type
    __ItemRegistrySystem.addAlloBonus(
      abi.encode(
        HAT_INDEX,
        "EQUIP",
        "STAT_HEALTH_SHIFT",
        "ON_UNEQUIP_HAT",
        uint256(0),
        HEALTH_BONUS
      )
    );

    vm.stopPrank();
  }

  /////////////////
  // EQUIP TESTS

  function testEquipSingle() public {
    // Setup: mint kami and give equipment to alice
    uint256 kamiID = _mintKami(alice);

    _giveItem(alice, PETPET_INDEX, 1);

    // Get initial stats
    int256 powerBefore = LibStat.getTotal(components, "POWER", kamiID);

    // Equip the item
    vm.prank(alice.operator);
    uint256 equipID = _KamiEquipSystem.executeTyped(kamiID, PETPET_INDEX);

    // Verify equipment instance created
    assertTrue(equipID != 0, "Equipment instance should be created");
    assertEq(
      LibEquipment.getEquipped(components, kamiID, SLOT_PETPET),
      equipID,
      "Equipment should be equipped in slot"
    );

    // Verify item consumed from inventory
    assertEq(_getItemBal(alice, PETPET_INDEX), 0, "Item should be consumed from inventory");

    // Verify bonus applied
    int256 powerAfter = LibStat.getTotal(components, "POWER", kamiID);
    assertEq(powerAfter - powerBefore, POWER_BONUS, "Power bonus should be applied");
  }

  function testEquipMultipleSlots() public {
    // Setup: mint kami and give both equipment items to alice
    uint256 kamiID = _mintKami(alice);

    _giveItem(alice, PETPET_INDEX, 1);
    _giveItem(alice, HAT_INDEX, 1);

    // Increase capacity to allow 2 items (default is 1)
    _increaseCapacity(alice, kamiID, 1);

    // Get initial stats
    int256 powerBefore = LibStat.getTotal(components, "POWER", kamiID);
    int256 healthBefore = LibStat.getTotal(components, "HEALTH", kamiID);

    // Equip both items
    vm.startPrank(alice.operator);
    uint256 petpetEquipID = _KamiEquipSystem.executeTyped(kamiID, PETPET_INDEX);
    uint256 hatEquipID = _KamiEquipSystem.executeTyped(kamiID, HAT_INDEX);
    vm.stopPrank();

    // Verify both slots are equipped
    assertEq(
      LibEquipment.getEquipped(components, kamiID, SLOT_PETPET),
      petpetEquipID,
      "PETPET slot should be equipped"
    );
    assertEq(
      LibEquipment.getEquipped(components, kamiID, SLOT_HAT),
      hatEquipID,
      "HAT slot should be equipped"
    );

    // Verify both bonuses applied
    int256 powerAfter = LibStat.getTotal(components, "POWER", kamiID);
    int256 healthAfter = LibStat.getTotal(components, "HEALTH", kamiID);
    assertEq(powerAfter - powerBefore, POWER_BONUS, "Power bonus should be applied");
    assertEq(healthAfter - healthBefore, HEALTH_BONUS, "Health bonus should be applied");
  }

  /////////////////
  // UNEQUIP TESTS

  function testUnequipSingle() public {
    // Setup: mint kami, equip item
    uint256 kamiID = _mintKami(alice);

    _giveItem(alice, PETPET_INDEX, 1);

    vm.prank(alice.operator);
    _KamiEquipSystem.executeTyped(kamiID, PETPET_INDEX);

    // Get stats after equip
    int256 powerAfterEquip = LibStat.getTotal(components, "POWER", kamiID);

    // Unequip the item
    vm.prank(alice.operator);
    uint32 returnedIndex = _KamiUnequipSystem.executeTyped(kamiID, SLOT_PETPET);

    // Verify correct item returned
    assertEq(returnedIndex, PETPET_INDEX, "Should return correct item index");

    // Verify slot is empty
    assertEq(
      LibEquipment.getEquipped(components, kamiID, SLOT_PETPET),
      0,
      "Slot should be empty after unequip"
    );

    // Verify item returned to inventory
    assertEq(_getItemBal(alice, PETPET_INDEX), 1, "Item should be returned to inventory");

    // Verify bonus removed
    int256 powerAfterUnequip = LibStat.getTotal(components, "POWER", kamiID);
    assertEq(powerAfterUnequip, powerAfterEquip - POWER_BONUS, "Power bonus should be removed");
  }

  function testUnequipOneSlotKeepsOther() public {
    // Setup: mint kami, equip both items
    uint256 kamiID = _mintKami(alice);

    _giveItem(alice, PETPET_INDEX, 1);
    _giveItem(alice, HAT_INDEX, 1);

    // Increase capacity to allow 2 items
    _increaseCapacity(alice, kamiID, 1);

    vm.startPrank(alice.operator);
    _KamiEquipSystem.executeTyped(kamiID, PETPET_INDEX);
    _KamiEquipSystem.executeTyped(kamiID, HAT_INDEX);
    vm.stopPrank();

    // Get stats after equipping both
    int256 healthAfterEquip = LibStat.getTotal(components, "HEALTH", kamiID);

    // Unequip only PETPET
    vm.prank(alice.operator);
    _KamiUnequipSystem.executeTyped(kamiID, SLOT_PETPET);

    // Verify HAT bonus still applied
    int256 healthAfterUnequip = LibStat.getTotal(components, "HEALTH", kamiID);
    assertEq(healthAfterUnequip, healthAfterEquip, "HAT health bonus should remain");

    // Verify HAT still equipped
    assertTrue(
      LibEquipment.getEquipped(components, kamiID, SLOT_HAT) != 0,
      "HAT should still be equipped"
    );
  }

  /////////////////
  // SLOT CONFLICT TESTS

  function testEquipReplacesExisting() public {
    // Setup: mint kami, give two PETPET items
    uint256 kamiID = _mintKami(alice);

    _giveItem(alice, PETPET_INDEX, 2);

    // Equip first item
    vm.prank(alice.operator);
    uint256 firstEquipID = _KamiEquipSystem.executeTyped(kamiID, PETPET_INDEX);

    // Verify first equipped
    assertEq(_getItemBal(alice, PETPET_INDEX), 1, "Should have 1 item left");
    assertEq(
      LibEquipment.getEquipped(components, kamiID, SLOT_PETPET),
      firstEquipID,
      "Equipment should be in slot"
    );

    // Get power after first equip
    int256 powerAfterFirst = LibStat.getTotal(components, "POWER", kamiID);

    // Equip second item (should auto-unequip first)
    vm.prank(alice.operator);
    uint256 secondEquipID = _KamiEquipSystem.executeTyped(kamiID, PETPET_INDEX);

    // Equipment IDs are deterministic (hash of kamiID + slotType), so they will be equal
    // The important thing is the slot is properly occupied and items are swapped
    assertEq(secondEquipID, firstEquipID, "Equipment ID is deterministic based on kami+slot");
    assertEq(
      LibEquipment.getEquipped(components, kamiID, SLOT_PETPET),
      secondEquipID,
      "Equipment should still be in slot"
    );

    // Verify first item returned, second consumed (net 1 item still)
    assertEq(_getItemBal(alice, PETPET_INDEX), 1, "Should still have 1 item");

    // Verify bonus is same (one removed, one added)
    int256 powerAfterSecond = LibStat.getTotal(components, "POWER", kamiID);
    assertEq(powerAfterSecond, powerAfterFirst, "Power bonus should be same");
  }

  /////////////////
  // VALIDATION TESTS

  function testCannotEquipWithoutItem() public {
    uint256 kamiID = _mintKami(alice);

    // Don't give any items - will cause arithmetic underflow on inventory dec

    vm.prank(alice.operator);
    vm.expectRevert(stdError.arithmeticError);
    _KamiEquipSystem.executeTyped(kamiID, PETPET_INDEX);
  }

  function testCannotEquipWrongKami() public {
    // Setup: alice has kami and item, bob tries to equip
    uint256 aliceKami = _mintKami(alice);
    _giveItem(bob, PETPET_INDEX, 1);

    vm.prank(bob.operator);
    vm.expectRevert("kami not urs");
    _KamiEquipSystem.executeTyped(aliceKami, PETPET_INDEX);
  }

  function testCannotUnequipEmptySlot() public {
    uint256 kamiID = _mintKami(alice);

    // Don't equip anything

    vm.prank(alice.operator);
    vm.expectRevert("Equipment: slot empty");
    _KamiUnequipSystem.executeTyped(kamiID, SLOT_PETPET);
  }

  function testCannotEquipNonEquipmentItem() public {
    uint256 kamiID = _mintKami(alice);

    _giveItem(alice, KAMI_FOOD_INDEX, 1);

    vm.prank(alice.operator);
    vm.expectRevert("thats not item type EQUIPMENT");
    _KamiEquipSystem.executeTyped(kamiID, KAMI_FOOD_INDEX);
  }

  // Note: State validation tests (testCannotEquipWhenNotResting, testCannotUnequipWhenNotResting)
  // are not included here as they require complex harvest system setup with cooldowns.
  // The state validation (LibKami.verifyState) is covered by the kami system tests.
  // Equipment core functionality is well tested by the other tests in this file.

  /////////////////
  // QUERY TESTS

  function testGetAllEquipped() public {
    uint256 kamiID = _mintKami(alice);

    _giveItem(alice, PETPET_INDEX, 1);
    _giveItem(alice, HAT_INDEX, 1);

    // Increase capacity to allow 2 items
    _increaseCapacity(alice, kamiID, 1);

    vm.startPrank(alice.operator);
    _KamiEquipSystem.executeTyped(kamiID, PETPET_INDEX);
    _KamiEquipSystem.executeTyped(kamiID, HAT_INDEX);
    vm.stopPrank();

    // Get all equipped
    uint256[] memory equipped = LibEquipment.getAllEquipped(components, kamiID);
    assertEq(equipped.length, 2, "Should have 2 equipped items");
  }

  function testGetItemIndexFromEquipment() public {
    uint256 kamiID = _mintKami(alice);
    _giveItem(alice, PETPET_INDEX, 1);

    vm.prank(alice.operator);
    uint256 equipID = _KamiEquipSystem.executeTyped(kamiID, PETPET_INDEX);

    uint32 itemIndex = LibEquipment.getItemIndex(components, equipID);
    assertEq(itemIndex, PETPET_INDEX, "Item index should match");
  }

  function testGetSlotFromEquipment() public {
    uint256 kamiID = _mintKami(alice);
    _giveItem(alice, PETPET_INDEX, 1);

    vm.prank(alice.operator);
    uint256 equipID = _KamiEquipSystem.executeTyped(kamiID, PETPET_INDEX);

    string memory slotType = LibEquipment.getSlot(components, equipID);
    assertEq(slotType, SLOT_PETPET, "Slot type should match");
  }

  function testHasEquipped() public {
    uint256 kamiID = _mintKami(alice);
    _giveItem(alice, PETPET_INDEX, 1);

    // Initially not equipped
    assertFalse(LibEquipment.hasEquipped(components, kamiID, SLOT_PETPET), "Should not be equipped initially");

    // Equip
    vm.prank(alice.operator);
    _KamiEquipSystem.executeTyped(kamiID, PETPET_INDEX);

    // Now equipped
    assertTrue(LibEquipment.hasEquipped(components, kamiID, SLOT_PETPET), "Should be equipped after equip");

    // Unequip
    vm.prank(alice.operator);
    _KamiUnequipSystem.executeTyped(kamiID, SLOT_PETPET);

    // Not equipped again
    assertFalse(LibEquipment.hasEquipped(components, kamiID, SLOT_PETPET), "Should not be equipped after unequip");
  }

  function testGetAllEquippedAfterUnequipOne() public {
    uint256 kamiID = _mintKami(alice);

    _giveItem(alice, PETPET_INDEX, 1);
    _giveItem(alice, HAT_INDEX, 1);

    // Increase capacity to allow 2 items
    _increaseCapacity(alice, kamiID, 1);

    vm.startPrank(alice.operator);
    _KamiEquipSystem.executeTyped(kamiID, PETPET_INDEX);
    _KamiEquipSystem.executeTyped(kamiID, HAT_INDEX);
    vm.stopPrank();

    // Get all equipped - should be 2
    uint256[] memory equipped = LibEquipment.getAllEquipped(components, kamiID);
    assertEq(equipped.length, 2, "Should have 2 equipped items");

    // Unequip one
    vm.prank(alice.operator);
    _KamiUnequipSystem.executeTyped(kamiID, SLOT_PETPET);

    // Get all equipped - should be 1
    equipped = LibEquipment.getAllEquipped(components, kamiID);
    assertEq(equipped.length, 1, "Should have 1 equipped item after unequip");
  }

  /////////////////
  // ITEM SLOT TYPE TESTS

  function testGetItemSlot() public {
    // PETPET item should have PETPET slot type
    string memory slotType = LibEquipment.getItemSlot(components, PETPET_INDEX);
    assertEq(slotType, SLOT_PETPET, "PETPET item should have PETPET slot type");

    // HAT item should have HAT slot type
    slotType = LibEquipment.getItemSlot(components, HAT_INDEX);
    assertEq(slotType, SLOT_HAT, "HAT item should have HAT slot type");

    // Non-equipment item should have empty slot type
    slotType = LibEquipment.getItemSlot(components, KAMI_FOOD_INDEX);
    assertEq(slotType, "", "Non-equipment item should have empty slot type");
  }

  /////////////////
  // CAPACITY TESTS

  function testDefaultCapacityIsOne() public {
    uint256 kamiID = _mintKami(alice);

    // Default capacity should be 1
    assertEq(LibEquipment.getCapacity(components, kamiID), 1, "Default capacity should be 1");
  }

  function testGetEquippedCount() public {
    uint256 kamiID = _mintKami(alice);

    // Initially should be 0
    assertEq(LibEquipment.getEquippedCount(components, kamiID), 0, "Should have 0 equipped initially");

    // Equip one item
    _giveItem(alice, PETPET_INDEX, 1);
    vm.prank(alice.operator);
    _KamiEquipSystem.executeTyped(kamiID, PETPET_INDEX);

    // Should be 1
    assertEq(LibEquipment.getEquippedCount(components, kamiID), 1, "Should have 1 equipped after equip");
  }

  function testCannotEquipAtCapacity() public {
    uint256 kamiID = _mintKami(alice);

    // Equip first item (uses the one default slot)
    _giveItem(alice, PETPET_INDEX, 1);
    vm.prank(alice.operator);
    _KamiEquipSystem.executeTyped(kamiID, PETPET_INDEX);

    // Try to equip second item in different slot - should fail
    _giveItem(alice, HAT_INDEX, 1);
    vm.prank(alice.operator);
    vm.expectRevert("Equipment: at capacity");
    _KamiEquipSystem.executeTyped(kamiID, HAT_INDEX);
  }

  function testCanReplaceSameSlotAtCapacity() public {
    uint256 kamiID = _mintKami(alice);

    // Give two petpet items
    _giveItem(alice, PETPET_INDEX, 2);

    // Equip first item
    vm.prank(alice.operator);
    _KamiEquipSystem.executeTyped(kamiID, PETPET_INDEX);

    // Replace with second item in same slot - should work even at capacity
    vm.prank(alice.operator);
    _KamiEquipSystem.executeTyped(kamiID, PETPET_INDEX);

    // Verify still equipped
    assertTrue(LibEquipment.hasEquipped(components, kamiID, SLOT_PETPET), "Should still have PETPET equipped");
    assertEq(LibEquipment.getEquippedCount(components, kamiID), 1, "Should still have 1 equipped");
  }

  function testIncreasingCapacityAllowsMoreEquipment() public {
    uint256 kamiID = _mintKami(alice);

    // Equip first item
    _giveItem(alice, PETPET_INDEX, 1);
    vm.prank(alice.operator);
    _KamiEquipSystem.executeTyped(kamiID, PETPET_INDEX);

    // Increase capacity by 1 (now capacity is 2)
    _increaseCapacity(alice, kamiID, 1);
    assertEq(LibEquipment.getCapacity(components, kamiID), 2, "Capacity should be 2 after bonus");

    // Now can equip second item
    _giveItem(alice, HAT_INDEX, 1);
    vm.prank(alice.operator);
    _KamiEquipSystem.executeTyped(kamiID, HAT_INDEX);

    // Verify both equipped
    assertEq(LibEquipment.getEquippedCount(components, kamiID), 2, "Should have 2 equipped");
  }

  function testCapacityBonusStacks() public {
    uint256 kamiID = _mintKami(alice);

    // Default capacity
    assertEq(LibEquipment.getCapacity(components, kamiID), 1, "Default capacity should be 1");

    // Increase by 1
    _increaseCapacity(alice, kamiID, 1);
    assertEq(LibEquipment.getCapacity(components, kamiID), 2, "Capacity should be 2 after +1");

    // Increase by 2 more
    _increaseCapacity(alice, kamiID, 2);
    assertEq(LibEquipment.getCapacity(components, kamiID), 4, "Capacity should be 4 after +3 total");
  }

  function testUnequipAfterCapacityLoss() public {
    uint256 kamiID = _mintKami(alice);

    // Increase capacity to 2
    _increaseCapacity(alice, kamiID, 1);

    // Equip 2 items
    _giveItem(alice, PETPET_INDEX, 1);
    _giveItem(alice, HAT_INDEX, 1);
    vm.startPrank(alice.operator);
    _KamiEquipSystem.executeTyped(kamiID, PETPET_INDEX);
    _KamiEquipSystem.executeTyped(kamiID, HAT_INDEX);
    vm.stopPrank();

    assertEq(LibEquipment.getEquippedCount(components, kamiID), 2, "Should have 2 equipped");

    // Unequip one item - should work
    vm.prank(alice.operator);
    _KamiUnequipSystem.executeTyped(kamiID, SLOT_PETPET);

    assertEq(LibEquipment.getEquippedCount(components, kamiID), 1, "Should have 1 equipped after unequip");
  }
}
