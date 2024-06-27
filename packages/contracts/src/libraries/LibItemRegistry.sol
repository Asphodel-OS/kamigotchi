// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { Stat } from "components/types/Stat.sol";

import { DescriptionComponent, ID as DescriptionCompID } from "components/DescriptionComponent.sol";
import { ExperienceComponent, ID as ExpCompID } from "components/ExperienceComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IsConsumableComponent, ID as IsConsumableCompID } from "components/IsConsumableComponent.sol";
import { IsLootboxComponent, ID as IsLootboxCompID } from "components/IsLootboxComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { KeysComponent, ID as KeysCompID } from "components/KeysComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { WeightsComponent, ID as WeightsCompID } from "components/WeightsComponent.sol";

import { LibStat } from "libraries/LibStat.sol";

// Registries hold shared information on individual entity instances in the world.
// This can include attribute information such as capabilities, stats and effects.
library LibItemRegistry {
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
    setIsRegistry(components, id);

    setName(components, id, name);
    setDescription(components, id, description);
    setMediaURI(components, id, mediaURI);
  }

  /// @notice Create a Registry entry for a Consumable Item.
  function createConsumable(
    IUintComp components,
    uint32 index,
    string memory name,
    string memory description,
    string memory type_,
    string memory mediaURI
  ) internal returns (uint256 id) {
    id = createItem(components, index, name, description, mediaURI);
    setIsConsumable(components, id);
    setType(components, id, type_);
  }

  /// @notice Create a Registry entry for a Food item. (e.g. gum, cookie sticks, etc)
  /** @dev
   * intended for registry entry 100-1000
   * potentially just labeled as a consumable in future
   */
  function createFood(
    IUintComp components,
    uint32 index,
    string memory name,
    string memory description,
    int32 health,
    uint256 experience,
    string memory mediaURI
  ) internal returns (uint256 id) {
    id = createItem(components, index, name, description, mediaURI);
    setIsConsumable(components, id);
    setType(components, id, "FOOD");

    if (health > 0) LibStat.setHealth(components, id, Stat(0, 0, 0, health));
    if (experience > 0) setExperience(components, id, experience);
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
    id = createItem(components, index, name, description, mediaURI);
    setIsConsumable(components, id);
    setIsLootbox(components, id);

    setKeys(components, id, keys);
    setWeights(components, id, weights);
  }

  /// @notice Create a Registry entry for a Revive item. (e.g. ribbon)
  /** @dev
   * intended for registry entry 1000-2000
   * potentially combined with food/consumable in future
   */
  function createRevive(
    IUintComp components,
    uint32 index,
    string memory name,
    string memory description,
    int32 health,
    string memory mediaURI
  ) internal returns (uint256 id) {
    id = createItem(components, index, name, description, mediaURI);
    setIsConsumable(components, id);
    setType(components, id, "REVIVE");
    LibStat.setHealth(components, id, Stat(0, 0, 0, health));
  }

  /// @notice delete a Registry entry for an item.
  function deleteItem(IUintComp components, uint256 id) internal {
    unsetIndex(components, id);
    unsetIsRegistry(components, id);
    unsetIsConsumable(components, id);
    unsetIsLootbox(components, id);

    unsetName(components, id);
    unsetDescription(components, id);
    unsetType(components, id);
    unsetMediaURI(components, id);

    LibStat.unsetHealth(components, id);
    LibStat.unsetPower(components, id);
    LibStat.unsetViolence(components, id);
    LibStat.unsetHarmony(components, id);
    LibStat.unsetSlots(components, id);
    unsetExperience(components, id);

    unsetKeys(components, id);
    unsetWeights(components, id);
  }

  /////////////////
  // CHECKERS

  function isItem(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).has(id);
  }

  function hasType(IUintComp components, uint256 id) internal view returns (bool) {
    return TypeComponent(getAddressById(components, TypeCompID)).has(id);
  }

  function isInstance(IUintComp components, uint256 id) internal view returns (bool) {
    return isRegistry(components, id) && isItem(components, id);
  }

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

  function setIndex(IUintComp components, uint256 id, uint32 index) internal {
    IndexItemComponent(getAddressById(components, IndexItemCompID)).set(id, index);
  }

  function setIsConsumable(IUintComp components, uint256 id) internal {
    IsConsumableComponent(getAddressById(components, IsConsumableCompID)).set(id);
  }

  function setIsLootbox(IUintComp components, uint256 id) internal {
    IsLootboxComponent(getAddressById(components, IsLootboxCompID)).set(id);
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

  function setKeys(IUintComp components, uint256 id, uint32[] memory keys) internal {
    KeysComponent(getAddressById(components, KeysCompID)).set(id, keys);
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

  function setWeights(IUintComp components, uint256 id, uint256[] memory weights) internal {
    WeightsComponent(getAddressById(components, WeightsCompID)).set(id, weights);
  }

  /////////////////
  // UNSETTERS

  function unsetExperience(IUintComp components, uint256 id) internal {
    ExperienceComponent comp = ExperienceComponent(getAddressById(components, ExpCompID));
    if (comp.has(id)) comp.remove(id);
  }

  function unsetDescription(IUintComp components, uint256 id) internal {
    DescriptionComponent comp = DescriptionComponent(getAddressById(components, DescriptionCompID));
    if (comp.has(id)) comp.remove(id);
  }

  function unsetIsConsumable(IUintComp components, uint256 id) internal {
    IsConsumableComponent comp = IsConsumableComponent(
      getAddressById(components, IsConsumableCompID)
    );
    if (comp.has(id)) comp.remove(id);
  }

  function unsetIsLootbox(IUintComp components, uint256 id) internal {
    IsLootboxComponent comp = IsLootboxComponent(getAddressById(components, IsLootboxCompID));
    if (comp.has(id)) comp.remove(id);
  }

  function unsetIsRegistry(IUintComp components, uint256 id) internal {
    IsRegistryComponent comp = IsRegistryComponent(getAddressById(components, IsRegCompID));
    if (comp.has(id)) comp.remove(id);
  }

  function unsetIndex(IUintComp components, uint256 id) internal {
    IndexItemComponent comp = IndexItemComponent(getAddressById(components, IndexItemCompID));
    if (comp.has(id)) comp.remove(id);
  }

  function unsetKeys(IUintComp components, uint256 id) internal {
    KeysComponent comp = KeysComponent(getAddressById(components, KeysCompID));
    if (comp.has(id)) comp.remove(id);
  }

  function unsetMediaURI(IUintComp components, uint256 id) internal {
    MediaURIComponent comp = MediaURIComponent(getAddressById(components, MediaURICompID));
    if (comp.has(id)) comp.remove(id);
  }

  function unsetName(IUintComp components, uint256 id) internal {
    NameComponent comp = NameComponent(getAddressById(components, NameCompID));
    if (comp.has(id)) comp.remove(id);
  }

  function unsetType(IUintComp components, uint256 id) internal {
    TypeComponent comp = TypeComponent(getAddressById(components, TypeCompID));
    if (comp.has(id)) comp.remove(id);
  }

  function unsetWeights(IUintComp components, uint256 id) internal {
    WeightsComponent comp = WeightsComponent(getAddressById(components, WeightsCompID));
    if (comp.has(id)) comp.remove(id);
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
