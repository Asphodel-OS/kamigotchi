// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { IDOwnsEquipmentComponent, ID as IDOwnsEquipCompID } from "components/IDOwnsEquipmentComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { SlotTypeComponent, ID as SlotTypeCompID } from "components/SlotTypeComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibReference } from "libraries/utils/LibReference.sol";

import { LibAllo } from "libraries/LibAllo.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibKami } from "libraries/LibKami.sol";

/**
 * @notice Equipment system for kamis
 *
 * Equipment items are regular items (type="EQUIPMENT") with:
 * - SlotType stored on the item registry (e.g., "PETPET", "HAT")
 * - Bonuses with end type "ON_UNEQUIP_{SLOT}" for automatic cleanup
 *
 * Equipment Instance shape: ID = hash("equipment.instance", kamiID, slotType)
 * - EntityType: EQUIPMENT
 * - IDOwnsEquipmentComponent: kamiID (owner)
 * - IndexItemComponent: itemIndex (which item)
 * - SlotTypeComponent: slot type string
 *
 * Equipping: consumes item from account inventory, creates instance, assigns bonuses
 * Unequipping: clears bonuses, removes instance, returns item to account inventory
 */
library LibEquipment {
  using LibComp for IUintComp;
  using LibString for string;
  using SafeCastLib for int256;

  string constant ENTITY_TYPE = "EQUIPMENT";
  string constant END_TYPE_PREFIX = "ON_UNEQUIP_";

  // Equipment capacity: base limit on total equipment a kami can have equipped
  uint256 constant DEFAULT_CAPACITY = 1;
  string constant CAPACITY_BONUS_TYPE = "EQUIP_CAPACITY_SHIFT";

  /////////////////
  // SHAPES

  /// @notice Create an equipment instance when equipping an item
  function createInstance(
    IUintComp components,
    uint256 kamiID,
    uint32 itemIndex,
    string memory slotType
  ) internal returns (uint256 id) {
    id = genID(kamiID, slotType);
    require(!LibEntityType.has(components, id), "Equipment: slot occupied");

    LibEntityType.set(components, id, ENTITY_TYPE);
    IDOwnsEquipmentComponent(getAddrByID(components, IDOwnsEquipCompID)).set(id, kamiID);
    IndexItemComponent(getAddrByID(components, IndexItemCompID)).set(id, itemIndex);
    SlotTypeComponent(getAddrByID(components, SlotTypeCompID)).set(id, slotType);
  }

  /// @notice Remove an equipment instance when unequipping
  function removeInstance(IUintComp components, uint256 id) internal {
    LibEntityType.remove(components, id);
    IDOwnsEquipmentComponent(getAddrByID(components, IDOwnsEquipCompID)).remove(id);
    IndexItemComponent(getAddrByID(components, IndexItemCompID)).remove(id);
    SlotTypeComponent(getAddrByID(components, SlotTypeCompID)).remove(id);
  }

  /////////////////
  // INTERACTIONS

  /// @notice Equip an item to a kami
  /// @param world The world contract
  /// @param components The components registry
  /// @param kamiID The kami entity ID
  /// @param accID The account entity ID (owner of inventory)
  /// @param itemIndex The item registry index
  function equip(
    IWorld world,
    IUintComp components,
    uint256 kamiID,
    uint256 accID,
    uint32 itemIndex
  ) internal returns (uint256 equipID) {
    // Verify item is equipment type
    LibItem.verifyType(components, itemIndex, ENTITY_TYPE);

    // Get slot type from item
    string memory slotType = getItemSlotType(components, itemIndex);
    require(!slotType.eq(""), "Equipment: no slot type");

    // Check if slot is occupied; if so, unequip first
    uint256 existingEquipID = getEquipped(components, kamiID, slotType);
    if (existingEquipID != 0) {
      unequip(world, components, kamiID, accID, slotType);
    } else {
      // Adding new equipment (not replacing) - check capacity
      require(getEquippedCount(components, kamiID) < getCapacity(components, kamiID), "Equipment: at capacity");
    }

    // Consume item from account inventory
    LibInventory.decFor(components, accID, itemIndex, 1);

    // Create equipment instance
    equipID = createInstance(components, kamiID, itemIndex, slotType);

    // Assign bonuses from item to kami
    // Bonuses use end type "ON_UNEQUIP_{SLOT}" for slot-specific cleanup
    uint256 bonusAlloID = getEquipBonusAlloID(itemIndex);
    LibBonus.assignTemporary(components, bonusAlloID, kamiID);
  }

  /// @notice Unequip an item from a kami slot
  /// @param world The world contract (unused but kept for consistency)
  /// @param components The components registry
  /// @param kamiID The kami entity ID
  /// @param accID The account entity ID (to return item to)
  /// @param slotType The slot type to unequip
  function unequip(
    IWorld world,
    IUintComp components,
    uint256 kamiID,
    uint256 accID,
    string memory slotType
  ) internal returns (uint32 itemIndex) {
    // Get equipment instance
    uint256 equipID = getEquipped(components, kamiID, slotType);
    require(equipID != 0, "Equipment: slot empty");

    // Get item index before removing
    itemIndex = IndexItemComponent(getAddrByID(components, IndexItemCompID)).get(equipID);

    // Clear bonuses for this slot
    string memory endType = genEndType(slotType);
    LibBonus.unassignBy(components, endType, kamiID);

    // Remove equipment instance
    removeInstance(components, equipID);

    // Return item to account inventory
    LibInventory.incFor(components, accID, itemIndex, 1);
  }

  /////////////////
  // CHECKERS

  /// @notice Check if a slot is occupied
  function hasEquipped(
    IUintComp components,
    uint256 kamiID,
    string memory slotType
  ) internal view returns (bool) {
    return getEquipped(components, kamiID, slotType) != 0;
  }

  /// @notice Verify kami can be equipped (must be in RESTING state)
  function verifyCanEquip(IUintComp components, uint256 kamiID) internal view {
    LibKami.verifyState(components, kamiID, "RESTING");
  }

  /////////////////
  // GETTERS

  /// @notice Get equipment instance for a kami slot
  function getEquipped(
    IUintComp components,
    uint256 kamiID,
    string memory slotType
  ) internal view returns (uint256) {
    uint256 id = genID(kamiID, slotType);
    return LibEntityType.isShape(components, id, ENTITY_TYPE) ? id : 0;
  }

  /// @notice Get all equipped item indices for a kami
  function getAllEquipped(
    IUintComp components,
    uint256 kamiID
  ) internal view returns (uint256[] memory) {
    return IDOwnsEquipmentComponent(getAddrByID(components, IDOwnsEquipCompID))
      .getEntitiesWithValue(kamiID);
  }

  /// @notice Get the item index from an equipment instance
  function getItemIndex(IUintComp components, uint256 equipID) internal view returns (uint32) {
    return IndexItemComponent(getAddrByID(components, IndexItemCompID)).get(equipID);
  }

  /// @notice Get slot type from an equipment instance
  function getSlotType(IUintComp components, uint256 equipID) internal view returns (string memory) {
    return SlotTypeComponent(getAddrByID(components, SlotTypeCompID)).get(equipID);
  }

  /// @notice Get slot type from an item registry entry
  function getItemSlotType(IUintComp components, uint32 itemIndex) internal view returns (string memory) {
    uint256 itemID = LibItem.genID(itemIndex);
    SlotTypeComponent comp = SlotTypeComponent(getAddrByID(components, SlotTypeCompID));
    return comp.has(itemID) ? comp.get(itemID) : "";
  }

  /// @notice Get total equipment capacity for a kami (default + bonuses)
  function getCapacity(IUintComp components, uint256 kamiID) internal view returns (uint256) {
    int256 bonus = LibBonus.getFor(components, CAPACITY_BONUS_TYPE, kamiID);
    // Bonus can be negative but total capacity should never go below 0
    if (bonus < 0 && uint256(-bonus) >= DEFAULT_CAPACITY) return 0;
    return uint256(int256(DEFAULT_CAPACITY) + bonus);
  }

  /// @notice Get current equipment count for a kami
  function getEquippedCount(IUintComp components, uint256 kamiID) internal view returns (uint256) {
    return getAllEquipped(components, kamiID).length;
  }

  /// @notice Get the allo ID for an equipment item's EQUIP use case bonus
  /// @dev The bonus registry entries are anchored to the allo entity, not the allo anchor
  function getEquipBonusAlloID(uint32 itemIndex) internal pure returns (uint256) {
    // Build the same anchor that addAlloBonus uses:
    // refID = LibItem.createUseCase(components, index, "EQUIP") = LibReference.genID("EQUIP", genRefAnchor(index))
    // anchorID = LibItem.genAlloAnchor(refID)
    // alloID = LibAllo.genID(anchorID, "BONUS", 1)
    uint256 refAnchor = LibItem.genRefAnchor(itemIndex);
    uint256 refID = LibReference.genID("EQUIP", refAnchor);
    uint256 alloAnchor = LibItem.genAlloAnchor(refID);
    return LibAllo.genID(alloAnchor, "BONUS", 1);
  }

  /////////////////
  // SETTERS

  /// @notice Set slot type on an item registry entry
  /// @dev Called during item registry setup
  function setItemSlotType(IUintComp components, uint32 itemIndex, string memory slotType) internal {
    uint256 itemID = LibItem.genID(itemIndex);
    SlotTypeComponent(getAddrByID(components, SlotTypeCompID)).set(itemID, slotType);
  }

  /////////////////
  // IDs

  /// @notice Generate deterministic equipment instance ID
  function genID(uint256 kamiID, string memory slotType) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("equipment.instance", kamiID, slotType)));
  }

  /// @notice Generate the end type string for a slot
  function genEndType(string memory slotType) internal pure returns (string memory) {
    return END_TYPE_PREFIX.concat(slotType);
  }
}
