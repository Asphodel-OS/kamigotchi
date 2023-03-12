// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IComponents } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IndexFoodComponent, ID as IndexFoodCompID } from "components/IndexFoodComponent.sol";
import { IndexEquipComponent, ID as IndexEquipCompID } from "components/IndexEquipComponent.sol";
import { IndexModifierComponent, ID as IndexModCompID } from "components/IndexModifierComponent.sol";
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
// have for the equipment use case. There is no requirement to use these taxonomic tiers
// exhaustively, but we should be consistent on depth within a given context.
library LibRegistryItem {
  /////////////////
  // INTERACTIONS
  // TODO: implement revives and scrolls

  // Create a registry entry for an equipment item. (e.g. armor, helmet, etc.)
  function createEquip(
    IWorld world,
    IComponents components,
    uint256 equipIndex,
    string memory name,
    string memory type_,
    uint256 health,
    uint256 harmony,
    uint256 power,
    uint256 violence,
    uint256 slots
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint256 itemIndex = getItemCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    IsNonFungibleComponent(getAddressById(components, IsNonFungCompID)).set(id);
    IndexItemComponent(getAddressById(components, IndexItemCompID)).set(id, itemIndex);
    IndexEquipComponent(getAddressById(components, IndexEquipCompID)).set(id, equipIndex);
    TypeComponent(getAddressById(components, TypeCompID)).set(id, type_); // body type
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
    if (health > 0) LibStat.setHealth(components, id, health);
    if (harmony > 0) LibStat.setHarmony(components, id, harmony);
    if (power > 0) LibStat.setPower(components, id, power);
    if (violence > 0) LibStat.setViolence(components, id, violence);
    if (slots > 0) LibStat.setSlots(components, id, slots);
    return id;
  }

  // Create a Registry entry for a Mod item. (e.g. cpu, gem, etc.)
  function createMod(
    IWorld world,
    IComponents components,
    uint256 modIndex,
    string memory name,
    uint256 health,
    uint256 harmony,
    uint256 power,
    uint256 violence
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint256 itemIndex = getItemCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    IsFungibleComponent(getAddressById(components, IsFungCompID)).set(id);
    IndexItemComponent(getAddressById(components, IndexItemCompID)).set(id, itemIndex);
    IndexModifierComponent(getAddressById(components, IndexModCompID)).set(id, modIndex);
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
    if (health > 0) LibStat.setHealth(components, id, health);
    if (harmony > 0) LibStat.setHarmony(components, id, harmony);
    if (power > 0) LibStat.setPower(components, id, power);
    if (violence > 0) LibStat.setViolence(components, id, violence);
    return id;
  }

  // Create a Registry entry for a Food item. (e.g. cpu, gem, etc.)
  // Q: should we run zero-value checks for name and health? (probably on system level)
  function createFood(
    IWorld world,
    IComponents components,
    uint256 foodIndex,
    string memory name,
    uint256 health
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint256 itemIndex = getItemCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    IsFungibleComponent(getAddressById(components, IsFungCompID)).set(id);
    IndexItemComponent(getAddressById(components, IndexItemCompID)).set(id, itemIndex);
    IndexFoodComponent(getAddressById(components, IndexFoodCompID)).set(id, foodIndex);
    setFood(components, foodIndex, name, health);
    return id;
  }

  /////////////////
  // SETTERS

  // set the field values of a food item registry entry
  function setFood(
    IComponents components,
    uint256 foodIndex,
    string memory name,
    uint256 health
  ) internal {
    uint256 id = getByFoodIndex(components, foodIndex);
    IndexFoodComponent(getAddressById(components, IndexFoodCompID)).set(id, foodIndex);
    if (!LibString.eq(name, ""))
      NameComponent(getAddressById(components, NameCompID)).set(id, name);
    if (health > 0) LibStat.setHealth(components, id, health);
  }

  /////////////////
  // CHECKERS

  function isInstance(IComponents components, uint256 id) internal view returns (bool) {
    return isRegistry(components, id) && hasItemIndex(components, id);
  }

  function isRegistry(IComponents components, uint256 id) internal view returns (bool) {
    return IsRegistryComponent(getAddressById(components, IsRegCompID)).has(id);
  }

  function isFungible(IComponents components, uint256 id) internal view returns (bool) {
    return IsFungibleComponent(getAddressById(components, IsFungCompID)).has(id);
  }

  function isNonFungible(IComponents components, uint256 id) internal view returns (bool) {
    return IsNonFungibleComponent(getAddressById(components, IsNonFungCompID)).has(id);
  }

  function hasEquipIndex(IComponents components, uint256 id) internal view returns (bool) {
    return IndexEquipComponent(getAddressById(components, IndexEquipCompID)).has(id);
  }

  function hasFoodIndex(IComponents components, uint256 id) internal view returns (bool) {
    return IndexFoodComponent(getAddressById(components, IndexFoodCompID)).has(id);
  }

  function hasItemIndex(IComponents components, uint256 id) internal view returns (bool) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).has(id);
  }

  function hasModIndex(IComponents components, uint256 id) internal view returns (bool) {
    return IndexModifierComponent(getAddressById(components, IndexModCompID)).has(id);
  }

  function hasName(IComponents components, uint256 id) internal view returns (bool) {
    return NameComponent(getAddressById(components, NameCompID)).has(id);
  }

  function hasType(IComponents components, uint256 id) internal view returns (bool) {
    return TypeComponent(getAddressById(components, TypeCompID)).has(id);
  }

  /////////////////
  // GETTERS

  function getEquipIndex(IComponents components, uint256 id) internal view returns (uint256) {
    return IndexEquipComponent(getAddressById(components, IndexEquipCompID)).getValue(id);
  }

  function getFoodIndex(IComponents components, uint256 id) internal view returns (uint256) {
    return IndexFoodComponent(getAddressById(components, IndexFoodCompID)).getValue(id);
  }

  function getItemIndex(IComponents components, uint256 id) internal view returns (uint256) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).getValue(id);
  }

  function getModIndex(IComponents components, uint256 id) internal view returns (uint256) {
    return IndexModifierComponent(getAddressById(components, IndexModCompID)).getValue(id);
  }

  function getName(IComponents components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddressById(components, NameCompID)).getValue(id);
  }

  function getType(IComponents components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).getValue(id);
  }

  /////////////////
  // QUERIES

  // get the number of item registry entries
  function getItemCount(IComponents components) internal view returns (uint256) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexItemCompID), "");
    return LibQuery.query(fragments).length;
  }

  // get the registry entry by item index
  function getByItemIndex(IComponents components, uint256 itemIndex)
    internal
    view
    returns (uint256 result)
  {
    uint256[] memory results = _getAllX(components, itemIndex, 0, 0, 0);
    if (results.length != 0) result = results[0];
  }

  // get the registry entry by item index
  function getByEquipIndex(IComponents components, uint256 equipIndex)
    internal
    view
    returns (uint256 result)
  {
    uint256[] memory results = _getAllX(components, 0, equipIndex, 0, 0);
    if (results.length != 0) result = results[0];
  }

  // get the registry entry by item index
  function getByFoodIndex(IComponents components, uint256 foodIndex)
    internal
    view
    returns (uint256 result)
  {
    uint256[] memory results = _getAllX(components, 0, 0, foodIndex, 0);
    if (results.length != 0) result = results[0];
  }

  // get the registry entry by item index
  function getByModIndex(IComponents components, uint256 modIndex)
    internal
    view
    returns (uint256 result)
  {
    uint256[] memory results = _getAllX(components, 0, 0, 0, modIndex);
    if (results.length != 0) result = results[0];
  }

  // get all item registry entities matching filters. 0 values indicate no filter
  function _getAllX(
    IComponents components,
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
