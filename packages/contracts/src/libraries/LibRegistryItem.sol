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
import { IndexEquipComponent, ID as IndexEquipCompID } from "components/IndexEquipComponent.sol";
import { IndexModComponent, ID as IndexModCompID } from "components/IndexModComponent.sol";
import { IsFungibleComponent, ID as IsFungCompID } from "components/IsFungibleComponent.sol";
import { IsNonFungibleComponent, ID as IsNonFungCompID } from "components/IsNonFungibleComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { LibStat } from "libraries/LibStat.sol";

// Registries hold shared information on individual entity instances in the world.
// This can include attribute information such as stats and effects or even prices
// commonly shared betweeen merchants. They also taxonomize entities in the world using
// the explicit Index Components (e.g. ItemIndex + EquipIndex|FoodIndex|ModIndex) to
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
  // TODO: implement revives and scrolls

  // Create a registry entry for an equipment item. (e.g. armor, helmet, etc.)
  function createEquip(
    IWorld world,
    IUintComp components,
    uint256 equipIndex,
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
    setEquipIndex(components, id, equipIndex);

    uint256 gotID = setEquip(components, id, name, type_, health, power, violence, harmony, slots);
    require(gotID == id, "LibRegistryItem.createEquip(): id mismatch");
    return id;
  }

  // Set the field values of an existing equipment item registry entry
  // NOTE: 0 values mean the component should be unset
  function setEquip(
    IUintComp components,
    uint256 equipIndex,
    string memory name,
    string memory type_,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots
  ) internal returns (uint256) {
    uint256 id = getByEquipIndex(components, equipIndex);
    require(id != 0, "LibRegistryItem.setEquip(): equipIndex not found");
    require(!LibString.eq(name, ""), "LibRegistryItem.setEquip(): name cannot be empty");
    require(!LibString.eq(type_, ""), "LibRegistryItem.setEquip(): type cannot be empty");

    setName(components, id, name);
    setType(components, id, type_);

    if (health > 0) LibStat.setHealth(components, id, health);
    else LibStat.removeHealth(components, id);

    if (harmony > 0) LibStat.setHarmony(components, id, harmony);
    else LibStat.removeHarmony(components, id);

    if (power > 0) LibStat.setPower(components, id, power);
    else LibStat.removePower(components, id);

    if (violence > 0) LibStat.setViolence(components, id, violence);
    else LibStat.removeViolence(components, id);

    if (slots > 0) LibStat.setSlots(components, id, slots);
    else LibStat.removeSlots(components, id);

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

    if (harmony > 0) LibStat.setHarmony(components, id, harmony);
    else LibStat.removeHarmony(components, id);

    if (violence > 0) LibStat.setViolence(components, id, violence);
    else LibStat.removeViolence(components, id);

    return id;
  }

  // Create a Registry entry for a Food item. (e.g. cpu, gem, etc.)
  function createFood(
    IWorld world,
    IUintComp components,
    uint256 foodIndex,
    string memory name,
    uint256 health
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint256 itemIndex = getItemCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    IsFungibleComponent(getAddressById(components, IsFungCompID)).set(id);
    setItemIndex(components, id, itemIndex);
    setFoodIndex(components, id, foodIndex);

    uint256 gotID = setFood(components, foodIndex, name, health);
    require(gotID == id, "LibRegistryItem.createFood(): entity ID mismatch");
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

  /////////////////
  // CHECKERS

  function isInstance(IUintComp components, uint256 id) internal view returns (bool) {
    return isRegistry(components, id) && hasItemIndex(components, id);
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

  function hasEquipIndex(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexEquipComponent(getAddressById(components, IndexEquipCompID)).has(id);
  }

  function hasFoodIndex(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexFoodComponent(getAddressById(components, IndexFoodCompID)).has(id);
  }

  function hasItemIndex(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).has(id);
  }

  function hasModIndex(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexModComponent(getAddressById(components, IndexModCompID)).has(id);
  }

  function hasName(IUintComp components, uint256 id) internal view returns (bool) {
    return NameComponent(getAddressById(components, NameCompID)).has(id);
  }

  function hasType(IUintComp components, uint256 id) internal view returns (bool) {
    return TypeComponent(getAddressById(components, TypeCompID)).has(id);
  }

  /////////////////
  // SETTERS

  function setEquipIndex(IUintComp components, uint256 id, uint256 equipIndex) internal {
    IndexEquipComponent(getAddressById(components, IndexEquipCompID)).set(id, equipIndex);
  }

  function setFoodIndex(IUintComp components, uint256 id, uint256 foodIndex) internal {
    IndexFoodComponent(getAddressById(components, IndexFoodCompID)).set(id, foodIndex);
  }

  function setItemIndex(IUintComp components, uint256 id, uint256 itemIndex) internal {
    IndexItemComponent(getAddressById(components, IndexItemCompID)).set(id, itemIndex);
  }

  function setModIndex(IUintComp components, uint256 id, uint256 modIndex) internal {
    IndexModComponent(getAddressById(components, IndexModCompID)).set(id, modIndex);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
  }

  function setType(IUintComp components, uint256 id, string memory type_) internal {
    TypeComponent(getAddressById(components, TypeCompID)).set(id, type_);
  }

  /////////////////
  // GETTERS

  function getEquipIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexEquipComponent(getAddressById(components, IndexEquipCompID)).getValue(id);
  }

  function getFoodIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexFoodComponent(getAddressById(components, IndexFoodCompID)).getValue(id);
  }

  function getItemIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).getValue(id);
  }

  function getModIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexModComponent(getAddressById(components, IndexModCompID)).getValue(id);
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

  // get the registry entry by item index
  function getByItemIndex(
    IUintComp components,
    uint256 itemIndex
  ) internal view returns (uint256 result) {
    uint256[] memory results = _getAllX(components, itemIndex, 0, 0, 0);
    if (results.length != 0) result = results[0];
  }

  // get the registry entry by item index
  function getByEquipIndex(
    IUintComp components,
    uint256 equipIndex
  ) internal view returns (uint256 result) {
    uint256[] memory results = _getAllX(components, 0, equipIndex, 0, 0);
    if (results.length != 0) result = results[0];
  }

  // get the registry entry by item index
  function getByFoodIndex(
    IUintComp components,
    uint256 foodIndex
  ) internal view returns (uint256 result) {
    uint256[] memory results = _getAllX(components, 0, 0, foodIndex, 0);
    if (results.length != 0) result = results[0];
  }

  // get the registry entry by item index
  function getByModIndex(
    IUintComp components,
    uint256 modIndex
  ) internal view returns (uint256 result) {
    uint256[] memory results = _getAllX(components, 0, 0, 0, modIndex);
    if (results.length != 0) result = results[0];
  }

  // get all item registry entities matching filters. 0 values indicate no filter
  function _getAllX(
    IUintComp components,
    uint256 itemIndex,
    uint256 equipIndex,
    uint256 foodIndex,
    uint256 modIndex
  ) internal view returns (uint256[] memory) {
    uint256 setFilters; // number of optional non-zero filters
    if (itemIndex != 0) setFilters++;
    if (equipIndex != 0) setFilters++;
    if (foodIndex != 0) setFilters++;
    if (modIndex != 0) setFilters++;

    uint256 filterCount = 2; // number of mandatory filters
    QueryFragment[] memory fragments = new QueryFragment[](setFilters + filterCount);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexItemCompID), "");

    if (itemIndex != 0) {
      fragments[filterCount++] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IndexItemCompID),
        abi.encode(itemIndex)
      );
    }
    if (equipIndex != 0) {
      fragments[filterCount++] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IndexEquipCompID),
        abi.encode(equipIndex)
      );
    }
    if (foodIndex != 0) {
      fragments[filterCount++] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IndexFoodCompID),
        abi.encode(foodIndex)
      );
    }
    if (modIndex != 0) {
      fragments[filterCount++] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IndexModCompID),
        abi.encode(modIndex)
      );
    }

    return LibQuery.query(fragments);
  }
}
