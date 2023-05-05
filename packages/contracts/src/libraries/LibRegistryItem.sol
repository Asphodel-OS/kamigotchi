// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IndexFoodComponent, ID as IndexFoodCompID } from "components/IndexFoodComponent.sol";
import { IndexGearComponent, ID as IndexGearCompID } from "components/IndexGearComponent.sol";
import { IndexModComponent, ID as IndexModCompID } from "components/IndexModComponent.sol";
import { IndexReviveComponent, ID as IndexReviveCompID } from "components/IndexReviveComponent.sol";
import { IsFungibleComponent, ID as IsFungCompID } from "components/IsFungibleComponent.sol";
import { IsNonFungibleComponent, ID as IsNonFungCompID } from "components/IsNonFungibleComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
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

  // Create a Registry entry for a Revive item. (e.g. cpu, gem, etc.)
  function createRevive(
    IWorld world,
    IUintComp components,
    uint256 foodIndex
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint256 itemIndex = getItemCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    IsFungibleComponent(getAddressById(components, IsFungCompID)).set(id);
    setItemIndex(components, id, itemIndex);
    setReviveIndex(components, id, foodIndex);
    return id;
  }

  // Create a Registry entry for a Food item. (e.g. cpu, gem, etc.)
  function createFood(
    IWorld world,
    IUintComp components,
    uint256 foodIndex
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint256 itemIndex = getItemCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    IsFungibleComponent(getAddressById(components, IsFungCompID)).set(id);
    setItemIndex(components, id, itemIndex);
    setFoodIndex(components, id, foodIndex);
    return id;
  }

  // Create a registry entry for an equipment item. (e.g. armor, helmet, etc.)
  function createGear(
    IWorld world,
    IUintComp components,
    uint256 gearIndex,
    string memory name,
    string memory type_,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint256 itemIndex = getItemCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    IsNonFungibleComponent(getAddressById(components, IsNonFungCompID)).set(id);
    setItemIndex(components, id, itemIndex);
    setGearIndex(components, id, gearIndex);

    uint256 gotID = setGear(components, id, name, type_, health, power, violence, harmony, slots);
    require(gotID == id, "LibRegistryItem.createGear(): id mismatch");
    return id;
  }

  // Create a Registry entry for a Mod item. (e.g. cpu, gem, etc.)
  function createMod(
    IWorld world,
    IUintComp components,
    uint256 modIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint256 itemIndex = getItemCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    IsFungibleComponent(getAddressById(components, IsFungCompID)).set(id);
    setItemIndex(components, id, itemIndex);
    setModIndex(components, id, modIndex);

    uint256 gotID = setMod(components, modIndex, name, health, power, violence, harmony);
    require(gotID == id, "LibRegistryItem.createMod(): entity ID mismatch");
    return id;
  }

  // Set the field values of a food item registry entry
  function setFood(
    IUintComp components,
    uint256 foodIndex,
    string memory name,
    uint256 health
  ) internal returns (uint256) {
    uint256 id = getByFoodIndex(components, foodIndex);
    require(id != 0, "LibRegistryItem.setFood(): foodIndex not found");
    require(!LibString.eq(name, ""), "LibRegistryItem.setFood(): name cannot be empty");
    require(health > 0, "LibRegistryItem.setFood(): health must be greater than 0");

    setName(components, id, name);
    LibStat.setHealth(components, id, health);
    return id;
  }

  // Set the field values of an existing equipment item registry entry
  // NOTE: 0 values mean the component should be unset
  function setGear(
    IUintComp components,
    uint256 gearIndex,
    string memory name,
    string memory type_,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots
  ) internal returns (uint256) {
    uint256 id = getByGearIndex(components, gearIndex);
    require(id != 0, "LibRegistryItem.setGear(): gearIndex not found");
    require(!LibString.eq(name, ""), "LibRegistryItem.setGear(): name cannot be empty");
    require(!LibString.eq(type_, ""), "LibRegistryItem.setGear(): type cannot be empty");

    setName(components, id, name);
    setType(components, id, type_);

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

  // Set the field values of an existing mod item registry entry
  // NOTE: 0 values mean the component should be unset
  function setMod(
    IUintComp components,
    uint256 modIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony
  ) internal returns (uint256) {
    uint256 id = getByModIndex(components, modIndex);
    require(id != 0, "LibRegistryItem.setMod(): modIndex not found");
    require(!LibString.eq(name, ""), "LibRegistryItem.setMod(): name cannot be empty");

    setName(components, id, name);

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

  // Set the field values of a food item registry entry
  function setRevive(
    IUintComp components,
    uint256 reviveIndex,
    string memory name,
    uint256 health
  ) internal returns (uint256) {
    uint256 id = getByReviveIndex(components, reviveIndex);
    require(id != 0, "LibRegistryItem.setRevive(): reviveIndex not found");
    require(!LibString.eq(name, ""), "LibRegistryItem.setRevive(): name cannot be empty");
    require(health > 0, "LibRegistryItem.setRevive(): health must be greater than 0");

    setName(components, id, name);
    LibStat.setHealth(components, id, health);
    return id;
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

  function setGearIndex(IUintComp components, uint256 id, uint256 gearIndex) internal {
    IndexGearComponent(getAddressById(components, IndexGearCompID)).set(id, gearIndex);
  }

  function setItemIndex(IUintComp components, uint256 id, uint256 itemIndex) internal {
    IndexItemComponent(getAddressById(components, IndexItemCompID)).set(id, itemIndex);
  }

  function setModIndex(IUintComp components, uint256 id, uint256 modIndex) internal {
    IndexModComponent(getAddressById(components, IndexModCompID)).set(id, modIndex);
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
}
