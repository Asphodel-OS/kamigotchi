// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { Stat } from "components/types/StatComponent.sol";
import { DescriptionComponent, ID as DescriptionCompID } from "components/DescriptionComponent.sol";
import { ExperienceComponent, ID as ExpCompID } from "components/ExperienceComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IsConsumableComponent, ID as IsConsumableCompID } from "components/IsConsumableComponent.sol";
import { IsFungibleComponent, ID as IsFungCompID } from "components/IsFungibleComponent.sol";
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
library LibRegistryItem {
  /////////////////
  // INTERACTIONS

  // Create a Registry entry for a Consumable Item.
  function createConsumable(
    IWorld world,
    IUintComp components,
    uint32 index,
    string memory name,
    string memory description,
    string memory type_,
    string memory mediaURI
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIndex(components, id, index);
    setIsRegistry(components, id);
    setIsConsumable(components, id);
    setIsFungible(components, id);
    setType(components, id, type_);

    setName(components, id, name);
    setDescription(components, id, description);
    setMediaURI(components, id, mediaURI);
    return id;
  }

  // @notice sets lootbox registry entity
  // @param world       The world contract
  // @param components  The components contract
  // @param index   The index of the item to create an inventory for
  // @param keys    The keys of the items in lootbox's droptable
  // @param weights The weights of the items in lootbox's droptable
  function createLootbox(
    IWorld world,
    IUintComp components,
    uint32 index,
    string memory name,
    string memory description,
    uint32[] memory keys,
    uint256[] memory weights,
    string memory mediaURI
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    setIndex(components, id, index);
    setIsRegistry(components, id);
    setIsConsumable(components, id);
    setIsFungible(components, id);
    setIsLootbox(components, id);
    setType(components, id, "LOOTBOX");

    setKeys(components, id, keys);
    setWeights(components, id, weights);
    setName(components, id, name);
    setDescription(components, id, description);
    setMediaURI(components, id, mediaURI);
  }

  // @notice Create a Registry entry for a Food item. (e.g. gum, cookie sticks, etc)
  function createFood(
    IWorld world,
    IUintComp components,
    uint32 index,
    string memory name,
    string memory description,
    int32 health,
    uint256 experience,
    string memory mediaURI
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIndex(components, id, index);
    setIsRegistry(components, id);
    setIsConsumable(components, id);
    setIsFungible(components, id);
    setType(components, id, "FOOD");

    setName(components, id, name);
    setDescription(components, id, description);
    setMediaURI(components, id, mediaURI);

    if (health > 0) LibStat.setHealth(components, id, Stat(0, 0, 0, health));
    if (experience > 0) setExperience(components, id, experience);
    return id;
  }

  // Create a Registry entry for a Revive item. (e.g. ribbon)
  function createRevive(
    IWorld world,
    IUintComp components,
    uint32 index,
    string memory name,
    string memory description,
    int32 health,
    string memory mediaURI
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIndex(components, id, index);
    setIsRegistry(components, id);
    setIsConsumable(components, id);
    setIsFungible(components, id);
    setType(components, id, "REVIVE");

    setName(components, id, name);
    setDescription(components, id, description);
    setMediaURI(components, id, mediaURI);
    LibStat.setHealth(components, id, Stat(0, 0, 0, health));
    return id;
  }

  // @notice delete a Registry entry for an item.
  function deleteItem(IUintComp components, uint256 id) internal {
    unsetIndex(components, id);
    unsetIsRegistry(components, id);
    unsetIsConsumable(components, id);
    unsetIsFungible(components, id);
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

  function isFungible(IUintComp components, uint256 id) internal view returns (bool) {
    return IsFungibleComponent(getAddressById(components, IsFungCompID)).has(id);
  }

  /////////////////
  // GETTERS

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).getValue(id);
  }

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddressById(components, NameCompID)).getValue(id);
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).getValue(id);
  }

  /////////////////
  // SETTERS

  function setIndex(IUintComp components, uint256 id, uint32 index) internal {
    IndexItemComponent(getAddressById(components, IndexItemCompID)).set(id, index);
  }

  function setIsConsumable(IUintComp components, uint256 id) internal {
    IsConsumableComponent(getAddressById(components, IsConsumableCompID)).set(id);
  }

  function setIsFungible(IUintComp components, uint256 id) internal {
    IsFungibleComponent(getAddressById(components, IsFungCompID)).set(id);
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

  function unsetIsFungible(IUintComp components, uint256 id) internal {
    IsFungibleComponent comp = IsFungibleComponent(getAddressById(components, IsFungCompID));
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

  // get the number of item registry entries
  function getItemCount(IUintComp components) internal view returns (uint256) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexItemCompID), "");
    return LibQuery.query(fragments).length;
  }

  // get the associated item registry entry of a given instance entity
  function getByInstance(IUintComp components, uint256 instanceID) internal view returns (uint256) {
    uint32 index = getIndex(components, instanceID);
    return getByIndex(components, index);
  }

  // get the registry entry by item index
  function getByIndex(IUintComp components, uint32 index) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexItemCompID),
      abi.encode(index)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }

  ////////////////
  // TEST HELPERS

  function getAllFood(IUintComp components) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexItemCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, TypeCompID),
      abi.encode("FOOD")
    );

    return LibQuery.query(fragments);
  }

  function getAllRevive(IUintComp components) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexItemCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, TypeCompID),
      abi.encode("REVIVE")
    );

    return LibQuery.query(fragments);
  }
}
