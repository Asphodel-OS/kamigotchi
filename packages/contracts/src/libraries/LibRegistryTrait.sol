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
import { IndexTraitComponent, ID as IndexTraitCompID } from "components/IndexTraitComponent.sol";
import { IndexFaceComponent, ID as IndexFaceCompID } from "components/IndexFaceComponent.sol";
import { IndexGearComponent, ID as IndexGearCompID } from "components/IndexGearComponent.sol";
import { IndexHandComponent, ID as IndexHandCompID } from "components/IndexHandComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { LibStat } from "libraries/LibStat.sol";

// LibRegistryTrait is based heavily off LibRegistryItem, but is used for traits.
// All traits are considered fungible and are not compeitiable with the inventory layer but default, but can be added.
// Traits are compatible with stats and LibStat.
// IndexTrait is the domain index is automatically incremented

library LibRegistryTrait {
  /////////////////
  // INTERACTIONS

  // Create a Registry entry for a Body trait. (e.g. butterfly, cube)
  function createBody(
    IWorld world,
    IUintComp components,
    uint256 bodyIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint256 TraitIndex = getTraitCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    setTraitIndex(components, id, TraitIndex);
    setBodyIndex(components, id, bodyIndex);

    uint256 gotID = setBody(components, bodyIndex, name, health, power, violence, harmony, slots);
    require(gotID == id, "LibRegistryTrait.createBody(): entity ID mismatch");
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
    uint256 harmony,
    uint256 slots
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint256 TraitIndex = getTraitCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    setTraitIndex(components, id, TraitIndex);
    setBackgroundIndex(components, id, backgroundIndex);

    uint256 gotID = setBackground(
      components,
      backgroundIndex,
      name,
      health,
      power,
      violence,
      harmony,
      slots
    );
    require(gotID == id, "LibRegistryTrait.createbackground(): entity ID mismatch");
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
    uint256 harmony,
    uint256 slots
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint256 TraitIndex = getTraitCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    setTraitIndex(components, id, TraitIndex);
    setColorIndex(components, id, colorIndex);

    uint256 gotID = setColor(components, colorIndex, name, health, power, violence, harmony, slots);
    require(gotID == id, "LibRegistryTrait.createbackground(): entity ID mismatch");
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
    uint256 harmony,
    uint256 slots
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint256 TraitIndex = getTraitCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    setTraitIndex(components, id, TraitIndex);
    setFaceIndex(components, id, faceIndex);

    uint256 gotID = setFace(components, faceIndex, name, health, power, violence, harmony, slots);
    require(gotID == id, "LibRegistryTrait.createFace(): entity ID mismatch");
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
    uint256 harmony,
    uint256 slots
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint256 TraitIndex = getTraitCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    setTraitIndex(components, id, TraitIndex);
    setHandIndex(components, id, handIndex);

    uint256 gotID = setHand(components, handIndex, name, health, power, violence, harmony, slots);
    require(gotID == id, "LibRegistryTrait.createHand(): entity ID mismatch");
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
    uint256 harmony,
    uint256 slots
  ) internal returns (uint256) {
    uint256 id = getByBodyIndex(components, bodyIndex);
    require(id != 0, "LibRegistryTrait.setBody(): BodyIndex not found");
    require(!LibString.eq(name, ""), "LibRegistryTrait.setBody(): name cannot be empty");

    setName(components, id, name);

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

  // Set the field values of an existing background trait registry entry
  // NOTE: 0 values mean the component should be unset
  function setBackground(
    IUintComp components,
    uint256 backgroundIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots
  ) internal returns (uint256) {
    uint256 id = getByBackgroundIndex(components, backgroundIndex);
    require(id != 0, "LibRegistryTrait.setBackground(): BackgroundIndex not found");
    require(!LibString.eq(name, ""), "LibRegistryTrait.setBackground(): name cannot be empty");

    setName(components, id, name);

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

  // Set the field values of an existing color trait registry entry
  // NOTE: 0 values mean the component should be unset
  function setColor(
    IUintComp components,
    uint256 colorIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots
  ) internal returns (uint256) {
    uint256 id = getByColorIndex(components, colorIndex);
    require(id != 0, "LibRegistryTrait.setColor(): ColorIndex not found");
    require(!LibString.eq(name, ""), "LibRegistryTrait.setColor(): name cannot be empty");

    setName(components, id, name);

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

  // Set the field values of an existing face trait registry entry
  // NOTE: 0 values mean the component should be unset
  function setFace(
    IUintComp components,
    uint256 faceIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots
  ) internal returns (uint256) {
    uint256 id = getByFaceIndex(components, faceIndex);
    require(id != 0, "LibRegistryTrait.setFace(): faceIndex not found");
    require(!LibString.eq(name, ""), "LibRegistryTrait.setFace(): name cannot be empty");

    setName(components, id, name);

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

  // Set the field values of an existing hand trait registry entry
  // NOTE: 0 values mean the component should be unset
  function setHand(
    IUintComp components,
    uint256 handIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots
  ) internal returns (uint256) {
    uint256 id = getByHandIndex(components, handIndex);
    require(id != 0, "LibRegistryTrait.setHand(): handIndex not found");
    require(!LibString.eq(name, ""), "LibRegistryTrait.setHand(): name cannot be empty");

    setName(components, id, name);

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

  /////////////////
  // CHECKERS

  function isInstance(IUintComp components, uint256 id) internal view returns (bool) {
    return isRegistry(components, id) && isTrait(components, id);
  }

  function isRegistry(IUintComp components, uint256 id) internal view returns (bool) {
    return IsRegistryComponent(getAddressById(components, IsRegCompID)).has(id);
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

  function isHand(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexHandComponent(getAddressById(components, IndexHandCompID)).has(id);
  }

  function isTrait(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexTraitComponent(getAddressById(components, IndexTraitCompID)).has(id);
  }

  function hasName(IUintComp components, uint256 id) internal view returns (bool) {
    return NameComponent(getAddressById(components, NameCompID)).has(id);
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

  function setHandIndex(IUintComp components, uint256 id, uint256 handIndex) internal {
    IndexHandComponent(getAddressById(components, IndexHandCompID)).set(id, handIndex);
  }

  function setTraitIndex(IUintComp components, uint256 id, uint256 traitIndex) internal {
    IndexTraitComponent(getAddressById(components, IndexTraitCompID)).set(id, traitIndex);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
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

  function getHandIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexHandComponent(getAddressById(components, IndexHandCompID)).getValue(id);
  }

  function getTraitIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexTraitComponent(getAddressById(components, IndexTraitCompID)).getValue(id);
  }

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddressById(components, NameCompID)).getValue(id);
  }

  /////////////////
  // QUERIES

  // get the number of Trait registry entries
  function getTraitCount(IUintComp components) internal view returns (uint256) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexTraitCompID), "");
    return LibQuery.query(fragments).length;
  }

  // get the registry entry by Trait index
  function getByTraitIndex(
    IUintComp components,
    uint256 traitIndex
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexTraitCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexTraitCompID),
      abi.encode(traitIndex)
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
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexTraitCompID), "");
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
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexTraitCompID), "");
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
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexTraitCompID), "");
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
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexTraitCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexFaceCompID),
      abi.encode(faceIndex)
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
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexTraitCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexHandCompID),
      abi.encode(handIndex)
    );
    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }
}
