// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IndexBodyComponent, ID as IndexBodyCompID } from "components/IndexBodyComponent.sol";
import { IndexBackgroundComponent, ID as IndexBackgroundCompID } from "components/IndexBackgroundComponent.sol";
import { IndexColorComponent, ID as IndexColorCompID } from "components/IndexColorComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IndexFaceComponent, ID as IndexFaceCompID } from "components/IndexFaceComponent.sol";
import { IndexFoodComponent, ID as IndexFoodCompID } from "components/IndexFoodComponent.sol";
import { IndexGearComponent, ID as IndexGearCompID } from "components/IndexGearComponent.sol";
import { IndexHandComponent, ID as IndexHandCompID } from "components/IndexHandComponent.sol";
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
  // TODO: implement revives and scrolls

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
    require(gotID == id, "LibRegistryItem.createFood(): entity ID mismatch"); // prevents duplicates
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

  // Create a Registry entry for a Body trait. (e.g. butterfly, cube)
  function createBody(
    IWorld world,
    IUintComp components,
    uint256 bodyIndex,
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
    setBodyIndex(components, id, bodyIndex);

    uint256 gotID = setBody(components, bodyIndex, name, health, power, violence, harmony);
    require(gotID == id, "LibRegistryItem.createBody(): entity ID mismatch");
    return id;
  }

  // Create a Registry entry for a Background trait. (e.g. green, blue)
  function createBackground(
    IWorld world,
    IUintComp components,
    uint256 backgroundIndex,
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
    setBackgroundIndex(components, id, backgroundIndex);

    uint256 gotID = setBackground(
      components,
      backgroundIndex,
      name,
      health,
      power,
      violence,
      harmony
    );
    require(gotID == id, "LibRegistryItem.createbackground(): entity ID mismatch");
    return id;
  }

  // Create a Registry entry for a color trait. (e.g. green, blue)
  function createColor(
    IWorld world,
    IUintComp components,
    uint256 colorIndex,
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
    setColorIndex(components, id, colorIndex);

    uint256 gotID = setColor(components, colorIndex, name, health, power, violence, harmony);
    require(gotID == id, "LibRegistryItem.createbackground(): entity ID mismatch");
    return id;
  }

  // Create a Registry entry for a Face trait. (e.g. green, blue)
  function createFace(
    IWorld world,
    IUintComp components,
    uint256 faceIndex,
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
    setFaceIndex(components, id, faceIndex);

    uint256 gotID = setFace(components, faceIndex, name, health, power, violence, harmony);
    require(gotID == id, "LibRegistryItem.createFace(): entity ID mismatch");
    return id;
  }

  // Create a Registry entry for a Hand trait. (e.g. green, blue)
  function createHand(
    IWorld world,
    IUintComp components,
    uint256 handIndex,
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
    setHandIndex(components, id, handIndex);

    uint256 gotID = setHand(components, handIndex, name, health, power, violence, harmony);
    require(gotID == id, "LibRegistryItem.createHand(): entity ID mismatch");
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

  // Set the field values of an existing boody trait registry entry
  // NOTE: 0 values mean the component should be unset
  function setBody(
    IUintComp components,
    uint256 bodyIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony
  ) internal returns (uint256) {
    uint256 id = getByBodyIndex(components, bodyIndex);
    require(id != 0, "LibRegistryItem.setBody(): BodyIndex not found");
    require(!LibString.eq(name, ""), "LibRegistryItem.setBody(): name cannot be empty");

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

  // Set the field values of an existing background trait registry entry
  // NOTE: 0 values mean the component should be unset
  function setBackground(
    IUintComp components,
    uint256 backgroundIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony
  ) internal returns (uint256) {
    uint256 id = getByBackgroundIndex(components, backgroundIndex);
    require(id != 0, "LibRegistryItem.setBackground(): BackgroundIndex not found");
    require(!LibString.eq(name, ""), "LibRegistryItem.setBackground(): name cannot be empty");

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

  // Set the field values of an existing color trait registry entry
  // NOTE: 0 values mean the component should be unset
  function setColor(
    IUintComp components,
    uint256 colorIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony
  ) internal returns (uint256) {
    uint256 id = getByColorIndex(components, colorIndex);
    require(id != 0, "LibRegistryItem.setColor(): ColorIndex not found");
    require(!LibString.eq(name, ""), "LibRegistryItem.setColor(): name cannot be empty");

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

  // Set the field values of an existing face trait registry entry
  // NOTE: 0 values mean the component should be unset
  function setFace(
    IUintComp components,
    uint256 faceIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony
  ) internal returns (uint256) {
    uint256 id = getByFaceIndex(components, faceIndex);
    require(id != 0, "LibRegistryItem.setFace(): faceIndex not found");
    require(!LibString.eq(name, ""), "LibRegistryItem.setFace(): name cannot be empty");

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

  // Set the field values of an existing hand trait registry entry
  // NOTE: 0 values mean the component should be unset
  function setHand(
    IUintComp components,
    uint256 handIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony
  ) internal returns (uint256) {
    uint256 id = getByHandIndex(components, handIndex);
    require(id != 0, "LibRegistryItem.setHand(): handIndex not found");
    require(!LibString.eq(name, ""), "LibRegistryItem.setHand(): name cannot be empty");

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

  /////////////////
  // CHECKERS

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

  function isBody(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexBodyComponent(getAddressById(components, IndexBodyCompID)).has(id);
  }

  function isBackground(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexBackgroundComponent(getAddressById(components, IndexBackgroundCompID)).has(id);
  }

  function isColor(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexColorComponent(getAddressById(components, IndexColorCompID)).has(id);
  }

  function isFace(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexFaceComponent(getAddressById(components, IndexFaceCompID)).has(id);
  }

  function isFood(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexFoodComponent(getAddressById(components, IndexFoodCompID)).has(id);
  }

  function isHand(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexHandComponent(getAddressById(components, IndexHandCompID)).has(id);
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

  function hasName(IUintComp components, uint256 id) internal view returns (bool) {
    return NameComponent(getAddressById(components, NameCompID)).has(id);
  }

  function hasType(IUintComp components, uint256 id) internal view returns (bool) {
    return TypeComponent(getAddressById(components, TypeCompID)).has(id);
  }

  /////////////////
  // SETTERS

  function setBodyIndex(IUintComp components, uint256 id, uint256 bodyIndex) internal {
    IndexBodyComponent(getAddressById(components, IndexBodyCompID)).set(id, bodyIndex);
  }

  function setBackgroundIndex(IUintComp components, uint256 id, uint256 backgroundIndex) internal {
    IndexBackgroundComponent(getAddressById(components, IndexBackgroundCompID)).set(
      id,
      backgroundIndex
    );
  }

  function setColorIndex(IUintComp components, uint256 id, uint256 colorIndex) internal {
    IndexColorComponent(getAddressById(components, IndexColorCompID)).set(id, colorIndex);
  }

  function setFaceIndex(IUintComp components, uint256 id, uint256 faceIndex) internal {
    IndexFaceComponent(getAddressById(components, IndexFaceCompID)).set(id, faceIndex);
  }

  function setFoodIndex(IUintComp components, uint256 id, uint256 foodIndex) internal {
    IndexFoodComponent(getAddressById(components, IndexFoodCompID)).set(id, foodIndex);
  }

  function setGearIndex(IUintComp components, uint256 id, uint256 gearIndex) internal {
    IndexGearComponent(getAddressById(components, IndexGearCompID)).set(id, gearIndex);
  }

  function setHandIndex(IUintComp components, uint256 id, uint256 handIndex) internal {
    IndexHandComponent(getAddressById(components, IndexHandCompID)).set(id, handIndex);
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

  function getBodyIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexBodyComponent(getAddressById(components, IndexBodyCompID)).getValue(id);
  }

  function getBackgroundIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexBackgroundComponent(getAddressById(components, IndexBackgroundCompID)).getValue(id);
  }

  function getColorIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexColorComponent(getAddressById(components, IndexColorCompID)).getValue(id);
  }

  function getFaceIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexFaceComponent(getAddressById(components, IndexFaceCompID)).getValue(id);
  }

  function getFoodIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexFoodComponent(getAddressById(components, IndexFoodCompID)).getValue(id);
  }

  function getGearIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexGearComponent(getAddressById(components, IndexGearCompID)).getValue(id);
  }

  function getHandIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexHandComponent(getAddressById(components, IndexHandCompID)).getValue(id);
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

  // get the associated item registry entry of a given instance entity
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

  // get the registry entry by body index
  function getByBodyIndex(
    IUintComp components,
    uint256 bodyIndex
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexBodyCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexBodyCompID),
      abi.encode(bodyIndex)
    );
    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }

  // get the registry entry by background index
  function getByBackgroundIndex(
    IUintComp components,
    uint256 backgroundIndex
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(
      QueryType.Has,
      getComponentById(components, IndexBackgroundCompID),
      ""
    );
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexBackgroundCompID),
      abi.encode(backgroundIndex)
    );
    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }

  // get the registry entry by Color index
  function getByColorIndex(
    IUintComp components,
    uint256 colorIndex
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexColorCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexColorCompID),
      abi.encode(colorIndex)
    );
    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }

  // get the registry entry by Face index
  function getByFaceIndex(
    IUintComp components,
    uint256 faceIndex
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexFaceCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexFaceCompID),
      abi.encode(faceIndex)
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

  // get the registry entry by Hand index
  function getByHandIndex(
    IUintComp components,
    uint256 handIndex
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexHandCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexHandCompID),
      abi.encode(handIndex)
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
}
