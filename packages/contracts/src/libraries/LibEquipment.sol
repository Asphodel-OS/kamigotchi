// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { ForComponent, ID as ForCompID } from "components/ForComponent.sol";
import { IDOwnsEquipmentComponent, ID as IDOwnsEquipCompID } from "components/IDOwnsEquipmentComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibReference } from "libraries/utils/LibReference.sol";

import { LibAllo } from "libraries/LibAllo.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibKami } from "libraries/LibKami.sol";

/**
 * @notice Equipment system for kamis and accounts
 *
 * Equipment items are regular items (type="EQUIPMENT") with:
 * - For (slot) stored on the item registry (e.g., "Kami_Pet_Slot", "Account_Badge_Slot")
 * - Bonuses with end type "ON_UNEQUIP_{SLOT}" for automatic cleanup
 *
 * The "For" value encodes both the target type and slot:
 * - "Kami_Pet_Slot" = equipment for kamis, goes in pet slot
 * - "Account_Badge_Slot" = equipment for accounts, goes in badge slot
 *
 * Equipment Instance shape: ID = hash("equipment.instance", holderID, slot)
 * - EntityType: EQUIPMENT
 * - IDOwnsEquipmentComponent: holderID (kami or account that owns it)
 * - IndexItemComponent: itemIndex (which item)
 * - ForComponent: slot string
 *
 * Equipping: consumes item from inventory, creates instance, assigns bonuses
 * Unequipping: clears bonuses, removes instance, returns item to inventory
 */
library LibEquipment {
  using LibComp for IUintComp;
  using LibString for string;

  string constant ENTITY_TYPE = "EQUIPMENT";
  string constant END_TYPE_PREFIX = "ON_UNEQUIP_";

  // Equipment capacity: base limit on total equipment an entity can have equipped
  uint256 constant DEFAULT_CAPACITY = 1;
  string constant CAPACITY_BONUS_TYPE = "EQUIP_CAPACITY_SHIFT";

  /////////////////
  // SHAPES

  /// @notice Create an equipment instance when equipping an item
  /// @param holderID The entity being equipped (kami or account)
  function createInstance(
    IUintComp components,
    uint256 holderID,
    uint32 itemIndex,
    string memory slot
  ) internal returns (uint256 id) {
    id = genID(holderID, slot);
    require(!LibEntityType.has(components, id), "Equipment: slot occupied");

    LibEntityType.set(components, id, ENTITY_TYPE);
    IDOwnsEquipmentComponent(getAddrByID(components, IDOwnsEquipCompID)).set(id, holderID);
    IndexItemComponent(getAddrByID(components, IndexItemCompID)).set(id, itemIndex);
    ForComponent(getAddrByID(components, ForCompID)).set(id, slot);
  }

  /// @notice Remove an equipment instance when unequipping
  function removeInstance(IUintComp components, uint256 id) internal {
    LibEntityType.remove(components, id);
    IDOwnsEquipmentComponent(getAddrByID(components, IDOwnsEquipCompID)).remove(id);
    IndexItemComponent(getAddrByID(components, IndexItemCompID)).remove(id);
    ForComponent(getAddrByID(components, ForCompID)).remove(id);
  }

  /////////////////
  // INTERACTIONS

  /// @notice Equip an item to a holder (kami or account)
  /// @param world The world contract
  /// @param components The components registry
  /// @param holderID The entity being equipped (kami or account)
  /// @param inventoryID The entity whose inventory to consume from (usually account)
  /// @param itemIndex The item registry index
  function equip(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint256 inventoryID,
    uint32 itemIndex
  ) internal returns (uint256 equipID) {
    // Verify item is equipment type
    LibItem.verifyType(components, itemIndex, ENTITY_TYPE);

    // Get slot from item's For component
    string memory slot = getItemSlot(components, itemIndex);
    require(!slot.eq(""), "Equipment: no slot");

    // Check if slot is occupied; if so, unequip first
    uint256 existingEquipID = getEquipped(components, holderID, slot);
    if (existingEquipID != 0) {
      unequip(world, components, holderID, inventoryID, slot);
    } else {
      // Adding new equipment (not replacing) - check capacity
      require(getEquippedCount(components, holderID) < getCapacity(components, holderID), "Equipment: at capacity");
    }

    // Consume item from inventory
    LibInventory.decFor(components, inventoryID, itemIndex, 1);

    // Create equipment instance
    equipID = createInstance(components, holderID, itemIndex, slot);

    // Assign bonuses from item to holder
    // Bonuses use end type "ON_UNEQUIP_{SLOT}" for slot-specific cleanup
    uint256 bonusAlloID = getEquipBonusAlloID(itemIndex);
    LibBonus.assignTemporary(components, bonusAlloID, holderID);
  }

  /// @notice Unequip an item from a holder slot
  /// @param world The world contract (unused but kept for consistency)
  /// @param components The components registry
  /// @param holderID The entity being unequipped (kami or account)
  /// @param inventoryID The entity whose inventory to return item to (usually account)
  /// @param slot The slot to unequip
  function unequip(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint256 inventoryID,
    string memory slot
  ) internal returns (uint32 itemIndex) {
    // Get equipment instance
    uint256 equipID = getEquipped(components, holderID, slot);
    require(equipID != 0, "Equipment: slot empty");

    // Get item index before removing
    itemIndex = IndexItemComponent(getAddrByID(components, IndexItemCompID)).get(equipID);

    // Clear bonuses for this slot
    string memory endType = genEndType(slot);
    LibBonus.unassignBy(components, endType, holderID);

    // Remove equipment instance
    removeInstance(components, equipID);

    // Return item to inventory
    LibInventory.incFor(components, inventoryID, itemIndex, 1);
  }

  /////////////////
  // CHECKERS

  /// @notice Check if a slot is occupied
  function hasEquipped(
    IUintComp components,
    uint256 holderID,
    string memory slot
  ) internal view returns (bool) {
    return getEquipped(components, holderID, slot) != 0;
  }

  /// @notice Verify kami can be equipped (must be in RESTING state)
  /// @dev For account equipment, you may want a different check or none
  function verifyKamiCanEquip(IUintComp components, uint256 kamiID) internal view {
    LibKami.verifyState(components, kamiID, "RESTING");
  }

  /////////////////
  // GETTERS

  /// @notice Get equipment instance for a holder slot
  function getEquipped(
    IUintComp components,
    uint256 holderID,
    string memory slot
  ) internal view returns (uint256) {
    uint256 id = genID(holderID, slot);
    return LibEntityType.isShape(components, id, ENTITY_TYPE) ? id : 0;
  }

  /// @notice Get all equipment instance IDs for a holder
  function getAllEquipped(
    IUintComp components,
    uint256 holderID
  ) internal view returns (uint256[] memory) {
    return IDOwnsEquipmentComponent(getAddrByID(components, IDOwnsEquipCompID))
      .getEntitiesWithValue(holderID);
  }

  /// @notice Get the item index from an equipment instance
  function getItemIndex(IUintComp components, uint256 equipID) internal view returns (uint32) {
    return IndexItemComponent(getAddrByID(components, IndexItemCompID)).get(equipID);
  }

  /// @notice Get slot from an equipment instance
  function getSlot(IUintComp components, uint256 equipID) internal view returns (string memory) {
    return ForComponent(getAddrByID(components, ForCompID)).get(equipID);
  }

  /// @notice Get slot from an item registry entry (via For component)
  function getItemSlot(IUintComp components, uint32 itemIndex) internal view returns (string memory) {
    uint256 itemID = LibItem.genID(itemIndex);
    ForComponent comp = ForComponent(getAddrByID(components, ForCompID));
    return comp.has(itemID) ? comp.get(itemID) : "";
  }

  /// @notice Get total equipment capacity for a holder (default + bonuses)
  function getCapacity(IUintComp components, uint256 holderID) internal view returns (uint256) {
    int256 bonus = LibBonus.getFor(components, CAPACITY_BONUS_TYPE, holderID);
    // Bonus can be negative but total capacity should never go below 0
    if (bonus < 0 && uint256(-bonus) >= DEFAULT_CAPACITY) return 0;
    return uint256(int256(DEFAULT_CAPACITY) + bonus);
  }

  /// @notice Get current equipment count for a holder
  function getEquippedCount(IUintComp components, uint256 holderID) internal view returns (uint256) {
    return getAllEquipped(components, holderID).length;
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

  /// @notice Set slot on an item registry entry (via For component)
  /// @dev Called during item registry setup. Slot values like "Kami_Pet_Slot", "Account_Badge_Slot"
  function setItemSlot(IUintComp components, uint32 itemIndex, string memory slot) internal {
    uint256 itemID = LibItem.genID(itemIndex);
    ForComponent(getAddrByID(components, ForCompID)).set(itemID, slot);
  }

  /////////////////
  // IDs

  /// @notice Generate deterministic equipment instance ID
  function genID(uint256 holderID, string memory slot) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("equipment.instance", holderID, slot)));
  }

  /// @notice Generate the end type string for a slot
  function genEndType(string memory slot) internal pure returns (string memory) {
    return END_TYPE_PREFIX.concat(slot);
  }
}
