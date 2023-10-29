// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { DescriptionComponent, ID as DescriptionCompID } from "components/DescriptionComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IndexFoodComponent, ID as IndexFoodCompID } from "components/IndexFoodComponent.sol";
import { IndexGearComponent, ID as IndexGearCompID } from "components/IndexGearComponent.sol";
import { IndexModComponent, ID as IndexModCompID } from "components/IndexModComponent.sol";
import { IndexReviveComponent, ID as IndexReviveCompID } from "components/IndexReviveComponent.sol";
import { IsFungibleComponent, ID as IsFungCompID } from "components/IsFungibleComponent.sol";
import { IsNonFungibleComponent, ID as IsNonFungCompID } from "components/IsNonFungibleComponent.sol";
import { IsLootboxComponent, ID as IsLootboxCompID } from "components/IsLootboxComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { KeysComponent, ID as KeysCompID } from "components/KeysComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { WeightsComponent, ID as WeightsCompID } from "components/WeightsComponent.sol";

import { LibStat } from "libraries/LibStat.sol";

// Registries hold shared information on individual entity instances in the world.
// This can include attribute information such as stats and effects or even prices
// commonly shared betweeen merchants. They also taxonomize entities in the world using
// the explicit Index Components (e.g. ItemIndex + gearIndex|FoodIndex|ModIndex) to
// to identify the first two taxonomic tiers of Domain and Category.
//
// NOTE: The value of Domain Indices are automatically incremented for new entries, while
// Category Indices should be explicitly defined/referenced for human-readablility. These
// tiers of taxonomization are elaborated upon for the sake of a shared language, and we
// should revisit their naming if use cases demand further tiering. Very likely we will
// for the equipment use case. There is no requirement to use these taxonomic tiers
// exhaustively, but we should be consistent on depth within a given context.
library LibRegistryItem {
  /////////////////
  // INTERACTIONS

  // @notice Create a Registry entry for a Food item. (e.g. gum, cookie sticks, etc)
  function createFood(
    IWorld world,
    IUintComp components,
    uint256 index,
    uint256 foodIndex,
    string memory name,
    string memory description,
    uint256 health,
    string memory mediaURI
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIsRegistry(components, id);
    setIsFungible(components, id);
    setItemIndex(components, id, index);
    setFoodIndex(components, id, foodIndex);
    setName(components, id, name);
    setDescription(components, id, description);
    LibStat.setHealth(components, id, health);
    setMediaURI(components, id, mediaURI);
    return id;
  }

  // @notice Create a registry entry for an equipment item. (e.g. armor, helmet, etc.)
  function createGear(
    IWorld world,
    IUintComp components,
    uint256 index,
    uint256 gearIndex,
    string memory name,
    string memory description,
    string memory type_,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots,
    string memory mediaURI
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIsRegistry(components, id);
    setIsNonFungible(components, id);
    setItemIndex(components, id, index);
    setGearIndex(components, id, gearIndex);
    setName(components, id, name);
    setDescription(components, id, description);
    setType(components, id, type_);
    setMediaURI(components, id, mediaURI);

    if (health > 0) LibStat.setHealth(components, id, health);
    else LibStat.removeHealth(components, id);

    if (power > 0) LibStat.setPower(components, id, power);
    else LibStat.removePower(components, id);

    if (violence > 0) LibStat.setViolence(components, id, violence);
    else LibStat.removeViolence(components, id);

    if (harmony > 0) LibStat.setHarmony(components, id, harmony);
    else LibStat.removeHarmony(components, id);

    if (slots > 0) LibStat.setSlots(components, id, slots);
    else LibStat.removeSlots(components, id);

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
    uint256 index,
    string memory name,
    string memory description,
    uint256[] memory keys,
    uint256[] memory weights,
    string memory mediaURI
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    setIsRegistry(components, id);
    setIsFungible(components, id);
    setIsLootbox(components, id);
    setItemIndex(components, id, index);
    setKeys(components, id, keys);
    setWeights(components, id, weights);
    setName(components, id, name);
    setDescription(components, id, description);
    setMediaURI(components, id, mediaURI);
  }

  // Create a Registry entry for a Mod item. (e.g. cpu, gem, etc.)
  function createMod(
    IWorld world,
    IUintComp components,
    uint256 index,
    uint256 modIndex,
    string memory name,
    string memory description,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    string memory mediaURI
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIsRegistry(components, id);
    setIsFungible(components, id);
    setItemIndex(components, id, index);
    setModIndex(components, id, modIndex);
    setName(components, id, name);
    setDescription(components, id, description);
    setMediaURI(components, id, mediaURI);

    if (health > 0) LibStat.setHealth(components, id, health);
    else LibStat.removeHealth(components, id);

    if (power > 0) LibStat.setPower(components, id, power);
    else LibStat.removePower(components, id);

    if (violence > 0) LibStat.setViolence(components, id, violence);
    else LibStat.removeViolence(components, id);

    if (harmony > 0) LibStat.setHarmony(components, id, harmony);
    else LibStat.removeHarmony(components, id);

    return id;
  }

  // Create a Registry entry for a Revive item. (e.g. ribbon)
  function createRevive(
    IWorld world,
    IUintComp components,
    uint256 index,
    uint256 reviveIndex,
    string memory name,
    string memory description,
    uint256 health,
    string memory mediaURI
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIsRegistry(components, id);
    setIsFungible(components, id);
    setItemIndex(components, id, index);
    setReviveIndex(components, id, reviveIndex);
    setName(components, id, name);
    setDescription(components, id, description);
    LibStat.setHealth(components, id, health);
    setMediaURI(components, id, mediaURI);
    return id;
  }

  // @notice delete a Registry entry for an item.
  function deleteItem(IUintComp components, uint256 id) internal {
    unsetIsRegistry(components, id);
    unsetIsFungible(components, id);
    unsetIsNonFungible(components, id);
    unsetItemIndex(components, id);
    unsetName(components, id);
    unsetDescription(components, id);
    unsetType(components, id);
    unsetMediaURI(components, id);

    unsetFoodIndex(components, id);
    unsetGearIndex(components, id);
    unsetModIndex(components, id);
    unsetReviveIndex(components, id);
    unsetIsLootbox(components, id);

    LibStat.removeHealth(components, id);
    LibStat.removePower(components, id);
    LibStat.removeViolence(components, id);
    LibStat.removeHarmony(components, id);
    LibStat.removeSlots(components, id);

    unsetKeys(components, id);
    unsetWeights(components, id);
  }

  /////////////////
  // CHECKERS

  function hasName(IUintComp components, uint256 id) internal view returns (bool) {
    return NameComponent(getAddressById(components, NameCompID)).has(id);
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

  function isNonFungible(IUintComp components, uint256 id) internal view returns (bool) {
    return IsNonFungibleComponent(getAddressById(components, IsNonFungCompID)).has(id);
  }

  function isFood(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexFoodComponent(getAddressById(components, IndexFoodCompID)).has(id);
  }

  function isGear(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexGearComponent(getAddressById(components, IndexGearCompID)).has(id);
  }

  function isItem(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).has(id);
  }

  function isMod(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexModComponent(getAddressById(components, IndexModCompID)).has(id);
  }

  function isRevive(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexReviveComponent(getAddressById(components, IndexReviveCompID)).has(id);
  }

  /////////////////
  // SETTERS

  function setFoodIndex(IUintComp components, uint256 id, uint256 foodIndex) internal {
    IndexFoodComponent(getAddressById(components, IndexFoodCompID)).set(id, foodIndex);
  }

  function setDescription(IUintComp components, uint256 id, string memory description) internal {
    DescriptionComponent(getAddressById(components, DescriptionCompID)).set(id, description);
  }

  function setGearIndex(IUintComp components, uint256 id, uint256 gearIndex) internal {
    IndexGearComponent(getAddressById(components, IndexGearCompID)).set(id, gearIndex);
  }

  function setIsFungible(IUintComp components, uint256 id) internal {
    IsFungibleComponent(getAddressById(components, IsFungCompID)).set(id);
  }

  function setIsNonFungible(IUintComp components, uint256 id) internal {
    IsNonFungibleComponent(getAddressById(components, IsNonFungCompID)).set(id);
  }

  function setIsLootbox(IUintComp components, uint256 id) internal {
    IsLootboxComponent(getAddressById(components, IsLootboxCompID)).set(id);
  }

  function setIsRegistry(IUintComp components, uint256 id) internal {
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
  }

  function setItemIndex(IUintComp components, uint256 id, uint256 itemIndex) internal {
    IndexItemComponent(getAddressById(components, IndexItemCompID)).set(id, itemIndex);
  }

  function setKeys(IUintComp components, uint256 id, uint256[] memory keys) internal {
    KeysComponent(getAddressById(components, KeysCompID)).set(id, keys);
  }

  function setModIndex(IUintComp components, uint256 id, uint256 modIndex) internal {
    IndexModComponent(getAddressById(components, IndexModCompID)).set(id, modIndex);
  }

  function setMediaURI(IUintComp components, uint256 id, string memory mediaURI) internal {
    MediaURIComponent(getAddressById(components, MediaURICompID)).set(id, mediaURI);
  }

  function setReviveIndex(IUintComp components, uint256 id, uint256 reviveIndex) internal {
    IndexReviveComponent(getAddressById(components, IndexReviveCompID)).set(id, reviveIndex);
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

  function unsetFoodIndex(IUintComp components, uint256 id) internal {
    IndexFoodComponent comp = IndexFoodComponent(getAddressById(components, IndexFoodCompID));
    if (comp.has(id)) comp.remove(id);
  }

  function unsetDescription(IUintComp components, uint256 id) internal {
    DescriptionComponent comp = DescriptionComponent(getAddressById(components, DescriptionCompID));
    if (comp.has(id)) comp.remove(id);
  }

  function unsetGearIndex(IUintComp components, uint256 id) internal {
    IndexGearComponent comp = IndexGearComponent(getAddressById(components, IndexGearCompID));
    if (comp.has(id)) comp.remove(id);
  }

  function unsetIsFungible(IUintComp components, uint256 id) internal {
    IsFungibleComponent comp = IsFungibleComponent(getAddressById(components, IsFungCompID));
    if (comp.has(id)) comp.remove(id);
  }

  function unsetIsNonFungible(IUintComp components, uint256 id) internal {
    IsNonFungibleComponent comp = IsNonFungibleComponent(
      getAddressById(components, IsNonFungCompID)
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

  function unsetItemIndex(IUintComp components, uint256 id) internal {
    IndexItemComponent comp = IndexItemComponent(getAddressById(components, IndexItemCompID));
    if (comp.has(id)) comp.remove(id);
  }

  function unsetKeys(IUintComp components, uint256 id) internal {
    KeysComponent comp = KeysComponent(getAddressById(components, KeysCompID));
    if (comp.has(id)) comp.remove(id);
  }

  function unsetModIndex(IUintComp components, uint256 id) internal {
    IndexModComponent comp = IndexModComponent(getAddressById(components, IndexModCompID));
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

  function unsetReviveIndex(IUintComp components, uint256 id) internal {
    IndexReviveComponent comp = IndexReviveComponent(getAddressById(components, IndexReviveCompID));
    if (comp.has(id)) comp.remove(id);
  }

  function unsetWeights(IUintComp components, uint256 id) internal {
    WeightsComponent comp = WeightsComponent(getAddressById(components, WeightsCompID));
    if (comp.has(id)) comp.remove(id);
  }

  /////////////////
  // GETTERS

  function getFoodIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexFoodComponent(getAddressById(components, IndexFoodCompID)).getValue(id);
  }

  function getGearIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexGearComponent(getAddressById(components, IndexGearCompID)).getValue(id);
  }

  function getItemIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).getValue(id);
  }

  function getModIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexModComponent(getAddressById(components, IndexModCompID)).getValue(id);
  }

  function getReviveIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexReviveComponent(getAddressById(components, IndexReviveCompID)).getValue(id);
  }

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddressById(components, NameCompID)).getValue(id);
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).getValue(id);
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
  // NOTE: the item instance will not have a [food, mod, gear]index, so unlikely anything
  // below the first conditional path is useful.
  function getByInstance(
    IUintComp components,
    uint instanceID
  ) internal view returns (uint result) {
    uint index;
    if (isItem(components, instanceID)) {
      index = getItemIndex(components, instanceID);
      result = getByItemIndex(components, index);
    } else if (isFood(components, instanceID)) {
      index = getFoodIndex(components, instanceID);
      result = getByFoodIndex(components, index);
    } else if (isGear(components, instanceID)) {
      index = getGearIndex(components, instanceID);
      result = getByGearIndex(components, index);
    } else if (isMod(components, instanceID)) {
      index = getModIndex(components, instanceID);
      result = getByModIndex(components, index);
    } else if (isRevive(components, instanceID)) {
      index = getReviveIndex(components, instanceID);
      result = getByReviveIndex(components, index);
    } else {
      revert("LibRegistryItem.getByInstance(): Entity does not have any associated indices");
    }
  }

  // get the registry entry by item index
  function getByItemIndex(
    IUintComp components,
    uint256 itemIndex
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexItemCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexItemCompID),
      abi.encode(itemIndex)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }

  // get the registry entry by food index
  function getByFoodIndex(
    IUintComp components,
    uint256 foodIndex
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexItemCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexFoodCompID),
      abi.encode(foodIndex)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }

  // get the registry entry by gear index
  function getByGearIndex(
    IUintComp components,
    uint256 gearIndex
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexItemCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexGearCompID),
      abi.encode(gearIndex)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }

  // get the registry entry by mod index
  function getByModIndex(
    IUintComp components,
    uint256 modIndex
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexItemCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexModCompID),
      abi.encode(modIndex)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }

  // get the registry entry by food index
  function getByReviveIndex(
    IUintComp components,
    uint256 reviveIndex
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexItemCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexReviveCompID),
      abi.encode(reviveIndex)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }

  function getAllFood(IUintComp components) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IndexFoodCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[2] = QueryFragment(QueryType.Has, getComponentById(components, IndexItemCompID), "");

    return LibQuery.query(fragments);
  }

  function getAllRevive(IUintComp components) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(
      QueryType.Has,
      getComponentById(components, IndexReviveCompID),
      ""
    );
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[2] = QueryFragment(QueryType.Has, getComponentById(components, IndexItemCompID), "");

    return LibQuery.query(fragments);
  }
}
