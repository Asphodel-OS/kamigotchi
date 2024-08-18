// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { Stat } from "components/types/Stat.sol";

import { DescriptionComponent, ID as DescriptionCompID } from "components/DescriptionComponent.sol";
import { ExperienceComponent, ID as ExpCompID } from "components/ExperienceComponent.sol";
import { ForComponent, ID as ForCompID } from "components/ForComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IsConsumableComponent, ID as IsConsumableCompID } from "components/IsConsumableComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

import { LibDroptable } from "libraries/LibDroptable.sol";
import { LibFor } from "libraries/utils/LibFor.sol";
import { LibFlag } from "libraries/LibFlag.sol";
import { LibStat } from "libraries/LibStat.sol";

// Registries hold shared information on individual entity instances in the world.
// This can include attribute information such as capabilities, stats and effects.
library LibItemRegistry {
  using SafeCastLib for int32;
  using LibString for string;

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
    require(
      !IndexItemComponent(getAddressById(components, IndexItemCompID)).has(id),
      "item reg: item alr exists"
    );

    setIndex(components, id, index);
    setType(components, id, type_);
    setIsRegistry(components, id);

    setName(components, id, name);
    setDescription(components, id, description);
    setMediaURI(components, id, mediaURI);
  }

  /// @notice Create a Registry entry for a Consumable Item.
  function createConsumable(
    IUintComp components,
    uint32 index,
    string memory for_,
    string memory name,
    string memory description,
    string memory type_,
    string memory mediaURI
  ) internal returns (uint256 id) {
    id = createItem(components, index, type_, name, description, mediaURI);
    setIsConsumable(components, id);

    LibFor.setFromString(components, id, for_);
  }

  /// @notice sets lootbox registry entity
  /// @param components  The components contract
  /// @param index   The index of the item to create an inventory for
  /// @param keys    The keys of the items in lootbox's droptable
  /// @param weights The weights of the items in lootbox's droptable
  /// @dev intended for registry entry 10000-11000
  function createLootbox(
    IUintComp components,
    uint32 index,
    string memory name,
    string memory description,
    uint32[] memory keys,
    uint256[] memory weights,
    string memory mediaURI
  ) internal returns (uint256 id) {
    id = createItem(components, index, "LOOTBOX", name, description, mediaURI);
    setIsConsumable(components, id);

    LibDroptable.set(components, id, keys, weights);
  }

  /// @notice adds a stat to an item
  function addStat(IUintComp components, uint256 id, string memory type_, int32 value) internal {
    if (type_.eq("XP"))
      setExperience(components, id, value.toUint256()); // TODO: convert this to Stat shape
    else if (type_.eq("HEALTH")) LibStat.setHealth(components, id, Stat(0, 0, 0, value));
    else if (type_.eq("MAXHEALTH")) LibStat.setHealth(components, id, Stat(0, value, 0, 0));
    else if (type_.eq("POWER")) LibStat.setPower(components, id, Stat(0, value, 0, 0));
    else if (type_.eq("VIOLENCE")) LibStat.setViolence(components, id, Stat(0, value, 0, 0));
    else if (type_.eq("HARMONY")) LibStat.setHarmony(components, id, Stat(0, value, 0, 0));
    else if (type_.eq("STAMINA")) LibStat.setStamina(components, id, Stat(0, 0, 0, value));
    else revert("LibItemRegistry: invalid stat");
  }

  /// @notice delete a Registry entry for an item.
  function deleteItem(IUintComp components, uint256 id) internal {
    IndexItemComponent indexComp = IndexItemComponent(getAddressById(components, IndexItemCompID));
    indexComp.remove(id);
    IsRegistryComponent(getAddressById(components, IsRegCompID)).remove(id);
    IsConsumableComponent(getAddressById(components, IsConsumableCompID)).remove(id);
    LibFor.unset(components, id);

    NameComponent(getAddressById(components, NameCompID)).remove(id);
    DescriptionComponent(getAddressById(components, DescriptionCompID)).remove(id);
    TypeComponent(getAddressById(components, TypeCompID)).remove(id);
    MediaURIComponent(getAddressById(components, MediaURICompID)).remove(id);

    LibDroptable.unset(components, id);

    LibStat.unsetHealth(components, id);
    LibStat.unsetPower(components, id);
    LibStat.unsetViolence(components, id);
    LibStat.unsetHarmony(components, id);
    LibStat.unsetSlots(components, id);
    LibStat.unsetStamina(components, id);
    ExperienceComponent(getAddressById(components, ExpCompID)).remove(id);

    LibFlag.removeFull(components, id, "ITEM_UNBURNABLE");
  }

  /////////////////
  // CHECKERS

  // check whether an entity is an item
  function isItem(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).has(id);
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
    return getComponentById(components, IsConsumableCompID).has(id);
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

  // check whether an entity is an Item Registry instance
  function isInstance(IUintComp components, uint256 id) internal view returns (bool) {
    return isRegistry(components, id) && isItem(components, id);
  }

  // check whether an entity is part of a Registry
  function isRegistry(IUintComp components, uint256 id) internal view returns (bool) {
    return IsRegistryComponent(getAddressById(components, IsRegCompID)).has(id);
  }

  /////////////////
  // GETTERS

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).get(id);
  }

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddressById(components, NameCompID)).get(id);
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    TypeComponent comp = TypeComponent(getAddressById(components, TypeCompID));
    return comp.has(id) ? comp.get(id) : "";
  }

  /////////////////
  // SETTERS

  function setUnburnable(IUintComp components, uint256 id) internal {
    LibFlag.setFull(components, id, "ITEM_UNBURNABLE");
  }

  function setIndex(IUintComp components, uint256 id, uint32 index) internal {
    IndexItemComponent(getAddressById(components, IndexItemCompID)).set(id, index);
  }

  function setIsConsumable(IUintComp components, uint256 id) internal {
    IsConsumableComponent(getAddressById(components, IsConsumableCompID)).set(id);
  }

  function setIsRegistry(IUintComp components, uint256 id) internal {
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
  }

  function setDescription(IUintComp components, uint256 id, string memory description) internal {
    DescriptionComponent(getAddressById(components, DescriptionCompID)).set(id, description);
  }

  function setExperience(IUintComp components, uint256 id, uint256 experience) internal {
    ExperienceComponent(getAddressById(components, ExpCompID)).set(id, experience);
  }

  function setMediaURI(IUintComp components, uint256 id, string memory mediaURI) internal {
    MediaURIComponent(getAddressById(components, MediaURICompID)).set(id, mediaURI);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
  }

  function setType(IUintComp components, uint256 id, string memory type_) internal {
    TypeComponent(getAddressById(components, TypeCompID)).set(id, type_);
  }

  /////////////////
  // QUERIES

  /// @notice get the associated item registry entry of a given instance entity
  /// @dev assumes instanceID is a valid inventory instance
  function getByInstance(IUintComp components, uint256 instanceID) internal view returns (uint256) {
    IndexItemComponent comp = IndexItemComponent(getAddressById(components, IndexItemCompID));
    uint32 index = comp.get(instanceID);
    uint256 id = genID(index);
    return comp.has(id) ? id : 0;
  }

  function getByIndex(IUintComp components, uint32 index) internal view returns (uint256) {
    IndexItemComponent comp = IndexItemComponent(getAddressById(components, IndexItemCompID));
    uint256 id = genID(index);
    return comp.has(id) ? id : 0;
  }

  /////////////////
  // UTILS

  /// @notice Retrieve the ID of a registry entry
  function genID(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("registry.item", index)));
  }
}
