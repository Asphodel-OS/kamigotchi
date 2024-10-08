// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { Stat } from "solecs/components/types/Stat.sol";

import { DescriptionComponent, ID as DescriptionCompID } from "components/DescriptionComponent.sol";
import { ExperienceComponent, ID as ExpCompID } from "components/ExperienceComponent.sol";
import { ForComponent, ID as ForCompID } from "components/ForComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IndexRoomComponent, ID as IndexRoomCompID } from "components/IndexRoomComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibData } from "libraries/LibData.sol";
import { LibDroptable } from "libraries/LibDroptable.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibFor } from "libraries/utils/LibFor.sol";
import { LibFlag } from "libraries/LibFlag.sol";
import { LibStat } from "libraries/LibStat.sol";
import { LibScore } from "libraries/LibScore.sol";

/** @notice
 * Items are shapes that can be held by inventories. They are fungible.
 *
 * Item info is stored via a registry shape:
 *  - EntityType: ITEM
 *  - IsRegistry
 *  - ItemIndex
 *  - Type
 *  - Name
 *  - Description
 *  - MediaURI
 *
 * Consumable items are a rough grouping of usable items (linked to a system).
 * they follow this pattern (although does not strictly need to):
 *  - Type: defines item behaviour. expected 1 system per type
 *  - For: for kamis/accounts/others
 *
 * Notable item shapes (defined in _ItemRegistrySystem):
 *  - lootbox: type LOOTBOX, LibDroptable for weights and keys
 */
library LibItem {
  using SafeCastLib for int32;
  using LibString for string;
  using LibComp for IComponent;

  /////////////////
  // SHAPES

  /// @notice create a base Registry entry for an item.
  /** @dev
   * empty item, can be built on for item types or left like this
   * $MUSU is an item like this, intended index 1
   */
  function createItem(
    IUintComp components,
    uint32 index,
    string memory type_,
    string memory name,
    string memory description,
    string memory mediaURI
  ) internal returns (uint256 id) {
    id = genID(index);
    LibEntityType.set(components, id, "ITEM");
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).set(id);
    IndexItemComponent(getAddrByID(components, IndexItemCompID)).set(id, index);

    TypeComponent(getAddrByID(components, TypeCompID)).set(id, type_);
    NameComponent(getAddrByID(components, NameCompID)).set(id, name);
    DescriptionComponent(getAddrByID(components, DescriptionCompID)).set(id, description);
    MediaURIComponent(getAddrByID(components, MediaURICompID)).set(id, mediaURI);
  }

  /// @notice adds a stat to an item
  function addStat(IUintComp components, uint256 id, string memory type_, int32 value) internal {
    if (type_.eq("XP"))
      ExperienceComponent(getAddrByID(components, ExpCompID)).set(id, value.toUint256());
    else if (type_.eq("HEALTH")) LibStat.setHealth(components, id, Stat(0, 0, 0, value));
    else if (type_.eq("MAXHEALTH")) LibStat.setHealth(components, id, Stat(0, value, 0, 0));
    else if (type_.eq("POWER")) LibStat.setPower(components, id, Stat(0, value, 0, 0));
    else if (type_.eq("VIOLENCE")) LibStat.setViolence(components, id, Stat(0, value, 0, 0));
    else if (type_.eq("HARMONY")) LibStat.setHarmony(components, id, Stat(0, value, 0, 0));
    else if (type_.eq("STAMINA")) LibStat.setStamina(components, id, Stat(0, 0, 0, value));
    else revert("LibItem: invalid stat");
  }

  /// @notice delete a Registry entry for an item.
  function deleteItem(IUintComp components, uint256 id) internal {
    LibEntityType.remove(components, id);
    IndexItemComponent indexComp = IndexItemComponent(getAddrByID(components, IndexItemCompID));
    indexComp.remove(id);
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).remove(id);

    NameComponent(getAddrByID(components, NameCompID)).remove(id);
    DescriptionComponent(getAddrByID(components, DescriptionCompID)).remove(id);
    TypeComponent(getAddrByID(components, TypeCompID)).remove(id);
    MediaURIComponent(getAddrByID(components, MediaURICompID)).remove(id);

    LibStat.unsetHealth(components, id);
    LibStat.unsetPower(components, id);
    LibStat.unsetViolence(components, id);
    LibStat.unsetHarmony(components, id);
    LibStat.unsetSlots(components, id);
    LibStat.unsetStamina(components, id);
    ExperienceComponent(getAddrByID(components, ExpCompID)).remove(id);

    LibDroptable.unset(components, id);
    LibFor.unset(components, id);
    LibFlag.removeFull(components, id, "ITEM_UNBURNABLE");
    IndexRoomComponent(getAddrByID(components, IndexRoomCompID)).remove(id);
  }

  /////////////////
  // INTERACTIONS

  /// @notice apply an item's stat to a target
  function applyStats(IUintComp components, uint32 itemIndex, uint256 targetID) internal {
    uint256 regID = genID(itemIndex);

    ExperienceComponent xpComp = ExperienceComponent(getAddrByID(components, ExpCompID));
    uint256 xp = xpComp.safeGet(regID);
    if (xp > 0) xpComp.inc(targetID, xp);

    LibStat.applyAll(components, regID, targetID);
  }

  function applyMove(IUintComp components, uint32 itemIndex, uint256 targetID) internal {
    uint256 regID = genID(itemIndex);
    IndexRoomComponent roomComp = IndexRoomComponent(getAddrByID(components, IndexRoomCompID));
    roomComp.set(targetID, roomComp.get(regID));
  }

  /////////////////
  // CHECKERS

  /// @notice check if entity is an item of specific type
  function isTypeOf(
    IUintComp components,
    uint32 index,
    string memory type_
  ) internal view returns (bool) {
    uint256 id = genID(index);
    return
      LibEntityType.isShape(components, id, "ITEM") ||
      getCompByID(components, TypeCompID).eqString(id, type_);
  }

  function isTypeOf(
    IUintComp components,
    uint32[] memory indices,
    string memory type_
  ) internal view returns (bool) {
    uint256[] memory ids = new uint256[](indices.length);
    for (uint256 i; i < indices.length; i++) ids[i] = genID(indices[i]);
    return
      LibEntityType.isShape(components, ids, "ITEM") ||
      LibComp.eqString(getCompByID(components, TypeCompID), ids, type_);
  }

  function isBurnable(IUintComp components, uint32 index) internal view returns (bool) {
    uint256 id = genID(index);
    return !LibFlag.has(components, id, "ITEM_UNBURNABLE");
  }

  function isBurnable(IUintComp components, uint32[] memory indices) internal view returns (bool) {
    uint256[] memory ids = new uint256[](indices.length);
    for (uint256 i; i < indices.length; i++) ids[i] = genID(indices[i]);
    return LibFlag.checkAll(components, ids, "ITEM_UNBURNABLE", false);
  }

  // check whether an entity is consumable by its index
  function isConsumable(IUintComp components, uint32 index) internal view returns (bool) {
    uint256 id = genID(index);
    // return getCompByID(components, IsConsumableCompID).has(id);
    return true;
  }

  function isForAccount(IUintComp components, uint32 index) internal view returns (bool) {
    return LibFor.isForAccount(components, genID(index));
  }

  function isForPet(IUintComp components, uint32 index) internal view returns (bool) {
    return LibFor.isForPet(components, genID(index));
  }

  // NOTE: temporary function as we decide how to identify revives with out type_
  function isRevive(IUintComp components, uint32 index) internal view returns (bool) {
    uint256 id = genID(index);
    string memory type_ = getType(components, id);
    return LibString.eq(type_, "REVIVE");
  }

  function isLootbox(IUintComp components, uint32 index) internal view returns (bool) {
    uint256 id = genID(index);
    string memory type_ = getType(components, id);
    return LibString.eq(type_, "LOOTBOX");
  }

  // check whether an entity is part of a Registry
  function isRegistry(IUintComp components, uint256 id) internal view returns (bool) {
    return IsRegistryComponent(getAddrByID(components, IsRegCompID)).has(id);
  }

  /////////////////
  // GETTERS

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexItemComponent(getAddrByID(components, IndexItemCompID)).get(id);
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    TypeComponent comp = TypeComponent(getAddrByID(components, TypeCompID));
    return comp.has(id) ? comp.get(id) : "";
  }

  /////////////////
  // SETTERS

  function setFor(IUintComp components, uint256 id, string memory for_) internal {
    LibFor.setFromString(components, id, for_);
  }

  function setRoom(IUintComp components, uint256 id, uint32 roomIndex) internal {
    IndexRoomComponent(getAddrByID(components, IndexRoomCompID)).set(id, roomIndex);
  }

  /// @notice prevent item from being burned via ItemBurnSystem
  function setUnburnable(IUintComp components, uint256 id) internal {
    LibFlag.setFull(components, id, "ITEM_UNBURNABLE");
  }

  /////////////////
  // QUERIES

  /// @notice get the associated item registry entry of a given instance entity
  /// @dev assumes instanceID is a valid inventory instance
  function getByInstance(IUintComp components, uint256 instanceID) internal view returns (uint256) {
    IndexItemComponent comp = IndexItemComponent(getAddrByID(components, IndexItemCompID));
    uint32 index = comp.get(instanceID);
    uint256 id = genID(index);
    return comp.has(id) ? id : 0;
  }

  function getByIndex(IUintComp components, uint32 index) internal view returns (uint256) {
    IndexItemComponent comp = IndexItemComponent(getAddrByID(components, IndexItemCompID));
    uint256 id = genID(index);
    return comp.has(id) ? id : 0;
  }

  /////////////////
  // UTILS

  /// @notice Retrieve the ID of a registry entry
  function genID(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("registry.item", index)));
  }

  /////////////////
  // DATA LOGGING

  function logUse(IUintComp components, uint256 accID, uint32 itemIndex, uint256 amt) internal {
    LibData.inc(components, accID, itemIndex, "ITEM_USE", amt);
  }

  function logFeed(IUintComp components, uint256 accID, uint256 amt) internal {
    // TODO: merge score and data entities?
    LibScore.incFor(components, accID, "FEED", amt);
    LibData.inc(components, accID, 0, "KAMI_FEED", amt); // world2: change to FEED
  }
}
