// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { Stat } from "components/types/StatComponent.sol";
import { IndexBodyComponent, ID as IndexBodyCompID } from "components/IndexBodyComponent.sol";
import { IndexBackgroundComponent, ID as IndexBackgroundCompID } from "components/IndexBackgroundComponent.sol";
import { IndexColorComponent, ID as IndexColorCompID } from "components/IndexColorComponent.sol";
import { IndexFaceComponent, ID as IndexFaceCompID } from "components/IndexFaceComponent.sol";
import { IndexHandComponent, ID as IndexHandCompID } from "components/IndexHandComponent.sol";
import { IndexTraitComponent, ID as IndexTraitCompID } from "components/IndexTraitComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { AffinityComponent, ID as AffinityCompID } from "components/AffinityComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { LibRandom } from "libraries/LibRandom.sol";
import { LibRarity } from "libraries/LibRarity.sol";
import { LibStat } from "libraries/LibStat.sol";

// LibRegistryTrait is based heavily off LibRegistryItem, but is used for traits.
// IndexTrait is the automatically incremented domain index, but traits are
// more commonly identified by the specific index (e.g. body, hand, color index)

library LibRegistryTrait {
  /////////////////
  // INTERACTIONS

  // Create a Registry entry for a Body trait. (e.g. butterfly, cube)
  function createBody(
    IWorld world,
    IUintComp components,
    uint32 bodyIndex,
    string memory name,
    int32 health,
    int32 power,
    int32 violence,
    int32 harmony,
    int32 slots,
    uint256 rarity,
    string memory affinity
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint32 traitIndex = getTraitCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    setTraitIndex(components, id, traitIndex);
    setBodyIndex(components, id, bodyIndex);

    uint256 gotID = setBody(
      components,
      bodyIndex,
      name,
      health,
      power,
      violence,
      harmony,
      slots,
      rarity,
      affinity
    );
    require(gotID == id, "LibRegistryTrait.createBody(): entity ID mismatch");
    return id;
  }

  // Create a Registry entry for a Background trait. (e.g. green, blue)
  function createBackground(
    IWorld world,
    IUintComp components,
    uint32 backgroundIndex,
    string memory name,
    int32 health,
    int32 power,
    int32 violence,
    int32 harmony,
    int32 slots,
    uint256 rarity
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint32 traitIndex = getTraitCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    setTraitIndex(components, id, traitIndex);
    setBackgroundIndex(components, id, backgroundIndex);

    uint256 gotID = setBackground(
      components,
      backgroundIndex,
      name,
      health,
      power,
      violence,
      harmony,
      slots,
      rarity
    );
    require(gotID == id, "LibRegistryTrait.createbackground(): entity ID mismatch");
    return id;
  }

  // Create a Registry entry for a color trait. (e.g. green, blue)
  function createColor(
    IWorld world,
    IUintComp components,
    uint32 colorIndex,
    string memory name,
    int32 health,
    int32 power,
    int32 violence,
    int32 harmony,
    int32 slots,
    uint256 rarity
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint32 traitIndex = getTraitCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    setTraitIndex(components, id, traitIndex);
    setColorIndex(components, id, colorIndex);

    uint256 gotID = setColor(
      components,
      colorIndex,
      name,
      health,
      power,
      violence,
      harmony,
      slots,
      rarity
    );
    require(gotID == id, "LibRegistryTrait.createbackground(): entity ID mismatch");
    return id;
  }

  // Create a Registry entry for a Face trait. (e.g. green, blue)
  function createFace(
    IWorld world,
    IUintComp components,
    uint32 faceIndex,
    string memory name,
    int32 health,
    int32 power,
    int32 violence,
    int32 harmony,
    int32 slots,
    uint256 rarity
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint32 traitIndex = getTraitCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    setTraitIndex(components, id, traitIndex);
    setFaceIndex(components, id, faceIndex);

    uint256 gotID = setFace(
      components,
      faceIndex,
      name,
      health,
      power,
      violence,
      harmony,
      slots,
      rarity
    );
    require(gotID == id, "LibRegistryTrait.createFace(): entity ID mismatch");
    return id;
  }

  // Create a Registry entry for a Hand trait. (e.g. green, blue)
  function createHand(
    IWorld world,
    IUintComp components,
    uint32 handIndex,
    string memory name,
    int32 health,
    int32 power,
    int32 violence,
    int32 harmony,
    int32 slots,
    uint256 rarity,
    string memory affinity
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint32 traitIndex = getTraitCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    setTraitIndex(components, id, traitIndex);
    setHandIndex(components, id, handIndex);

    uint256 gotID = setHand(
      components,
      handIndex,
      name,
      health,
      power,
      violence,
      harmony,
      slots,
      rarity,
      affinity
    );
    require(gotID == id, "LibRegistryTrait.createHand(): entity ID mismatch");
    return id;
  }

  // Set the field values of an existing boody trait registry entry
  // TODO: remove set pattern
  function setBody(
    IUintComp components,
    uint32 bodyIndex,
    string memory name,
    int32 health,
    int32 power,
    int32 violence,
    int32 harmony,
    int32 slots,
    uint256 rarity,
    string memory affinity
  ) internal returns (uint256) {
    uint256 id = getByBodyIndex(components, bodyIndex);
    require(id != 0, "LibRegistryTrait.setBody(): BodyIndex not found");
    require(!LibString.eq(name, ""), "LibRegistryTrait.setBody(): name cannot be empty");

    setName(components, id, name);

    if (health > 0) setHealth(components, id, health);
    else LibStat.unsetHealth(components, id);

    if (power > 0) setPower(components, id, power);
    else LibStat.unsetPower(components, id);

    if (violence > 0) setViolence(components, id, violence);
    else LibStat.unsetViolence(components, id);

    if (harmony > 0) setHarmony(components, id, harmony);
    else LibStat.unsetHarmony(components, id);

    if (slots > 0) setSlots(components, id, slots);
    else LibStat.unsetSlots(components, id);

    if (rarity > 0) LibRarity.set(components, id, rarity);
    else LibRarity.unset(components, id);

    if (!LibString.eq(affinity, "")) setAffinity(components, id, affinity);
    else unsetAffinity(components, id);

    return id;
  }

  // Set the field values of an existing background trait registry entry
  // TODO: remove set pattern
  function setBackground(
    IUintComp components,
    uint32 backgroundIndex,
    string memory name,
    int32 health,
    int32 power,
    int32 violence,
    int32 harmony,
    int32 slots,
    uint256 rarity
  ) internal returns (uint256) {
    uint256 id = getByBackgroundIndex(components, backgroundIndex);
    require(id != 0, "LibRegistryTrait.setBackground(): BackgroundIndex not found");
    require(!LibString.eq(name, ""), "LibRegistryTrait.setBackground(): name cannot be empty");

    setName(components, id, name);

    if (health > 0) setHealth(components, id, health);
    else LibStat.unsetHealth(components, id);

    if (power > 0) setPower(components, id, power);
    else LibStat.unsetPower(components, id);

    if (violence > 0) setViolence(components, id, violence);
    else LibStat.unsetViolence(components, id);

    if (harmony > 0) setHarmony(components, id, harmony);
    else LibStat.unsetHarmony(components, id);

    if (slots > 0) setSlots(components, id, slots);
    else LibStat.unsetSlots(components, id);

    if (rarity > 0) LibRarity.set(components, id, rarity);
    else LibRarity.unset(components, id);

    return id;
  }

  // Set the field values of an existing color trait registry entry
  // TODO: remove set pattern
  function setColor(
    IUintComp components,
    uint32 colorIndex,
    string memory name,
    int32 health,
    int32 power,
    int32 violence,
    int32 harmony,
    int32 slots,
    uint256 rarity
  ) internal returns (uint256) {
    uint256 id = getByColorIndex(components, colorIndex);
    require(id != 0, "LibRegistryTrait.setColor(): ColorIndex not found");
    require(!LibString.eq(name, ""), "LibRegistryTrait.setColor(): name cannot be empty");

    setName(components, id, name);

    if (health > 0) setHealth(components, id, health);
    else LibStat.unsetHealth(components, id);

    if (power > 0) setPower(components, id, power);
    else LibStat.unsetPower(components, id);

    if (violence > 0) setViolence(components, id, violence);
    else LibStat.unsetViolence(components, id);

    if (harmony > 0) setHarmony(components, id, harmony);
    else LibStat.unsetHarmony(components, id);

    if (slots > 0) setSlots(components, id, slots);
    else LibStat.unsetSlots(components, id);

    if (rarity > 0) LibRarity.set(components, id, rarity);
    else LibRarity.unset(components, id);

    return id;
  }

  // Set the field values of an existing face trait registry entry
  // TODO: remove set pattern
  function setFace(
    IUintComp components,
    uint32 faceIndex,
    string memory name,
    int32 health,
    int32 power,
    int32 violence,
    int32 harmony,
    int32 slots,
    uint256 rarity
  ) internal returns (uint256) {
    uint256 id = getByFaceIndex(components, faceIndex);
    require(id != 0, "LibRegistryTrait.setFace(): faceIndex not found");
    require(!LibString.eq(name, ""), "LibRegistryTrait.setFace(): name cannot be empty");

    setName(components, id, name);

    if (health > 0) setHealth(components, id, health);
    else LibStat.unsetHealth(components, id);

    if (power > 0) setPower(components, id, power);
    else LibStat.unsetPower(components, id);

    if (violence > 0) setViolence(components, id, violence);
    else LibStat.unsetViolence(components, id);

    if (harmony > 0) setHarmony(components, id, harmony);
    else LibStat.unsetHarmony(components, id);

    if (slots > 0) setSlots(components, id, slots);
    else LibStat.unsetSlots(components, id);

    if (rarity > 0) LibRarity.set(components, id, rarity);
    else LibRarity.unset(components, id);

    return id;
  }

  // Set the field values of an existing hand trait registry entry
  // TODO: remove set pattern
  function setHand(
    IUintComp components,
    uint32 handIndex,
    string memory name,
    int32 health,
    int32 power,
    int32 violence,
    int32 harmony,
    int32 slots,
    uint256 rarity,
    string memory affinity
  ) internal returns (uint256) {
    uint256 id = getByHandIndex(components, handIndex);
    require(id != 0, "LibRegistryTrait.setHand(): handIndex not found");
    require(!LibString.eq(name, ""), "LibRegistryTrait.setHand(): name cannot be empty");

    setName(components, id, name);

    if (health > 0) setHealth(components, id, health);
    else LibStat.unsetHealth(components, id);

    if (power > 0) setPower(components, id, power);
    else LibStat.unsetPower(components, id);

    if (violence > 0) setViolence(components, id, violence);
    else LibStat.unsetViolence(components, id);

    if (harmony > 0) setHarmony(components, id, harmony);
    else LibStat.unsetHarmony(components, id);

    if (slots > 0) setSlots(components, id, slots);
    else LibStat.unsetSlots(components, id);

    if (rarity > 0) LibRarity.set(components, id, rarity);
    else LibRarity.unset(components, id);

    if (!LibString.eq(affinity, "")) setAffinity(components, id, affinity);
    else unsetAffinity(components, id);

    return id;
  }

  function remove(IUintComp components, uint256 id) internal {
    IsRegistryComponent(getAddressById(components, IsRegCompID)).remove(id);
    IndexTraitComponent(getAddressById(components, IndexTraitCompID)).remove(id);
    NameComponent(getAddressById(components, NameCompID)).remove(id);
    if (isBody(components, id))
      IndexBodyComponent(getAddressById(components, IndexBodyCompID)).remove(id);
    if (isBackground(components, id))
      IndexBackgroundComponent(getAddressById(components, IndexBackgroundCompID)).remove(id);
    if (isColor(components, id))
      IndexColorComponent(getAddressById(components, IndexColorCompID)).remove(id);
    if (isFace(components, id))
      IndexFaceComponent(getAddressById(components, IndexFaceCompID)).remove(id);
    if (isHand(components, id))
      IndexHandComponent(getAddressById(components, IndexHandCompID)).remove(id);

    LibStat.unsetHealth(components, id);
    LibStat.unsetPower(components, id);
    LibStat.unsetViolence(components, id);
    LibStat.unsetHarmony(components, id);
    LibStat.unsetSlots(components, id);
    LibRarity.unset(components, id);
    unsetAffinity(components, id);
  }

  /////////////////
  // CHECKERS

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

  /////////////////
  // SETTERS

  function setBodyIndex(IUintComp components, uint256 id, uint32 bodyIndex) internal {
    IndexBodyComponent(getAddressById(components, IndexBodyCompID)).set(id, bodyIndex);
  }

  function setBackgroundIndex(IUintComp components, uint256 id, uint32 backgroundIndex) internal {
    IndexBackgroundComponent(getAddressById(components, IndexBackgroundCompID)).set(
      id,
      backgroundIndex
    );
  }

  function setColorIndex(IUintComp components, uint256 id, uint32 colorIndex) internal {
    IndexColorComponent(getAddressById(components, IndexColorCompID)).set(id, colorIndex);
  }

  function setFaceIndex(IUintComp components, uint256 id, uint32 faceIndex) internal {
    IndexFaceComponent(getAddressById(components, IndexFaceCompID)).set(id, faceIndex);
  }

  function setHandIndex(IUintComp components, uint256 id, uint32 handIndex) internal {
    IndexHandComponent(getAddressById(components, IndexHandCompID)).set(id, handIndex);
  }

  function setTraitIndex(IUintComp components, uint256 id, uint32 traitIndex) internal {
    IndexTraitComponent(getAddressById(components, IndexTraitCompID)).set(id, traitIndex);
  }

  function setAffinity(IUintComp components, uint256 id, string memory value) internal {
    AffinityComponent(getAddressById(components, AffinityCompID)).set(id, value);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
  }

  function setHarmony(IUintComp components, uint256 id, int32 value) internal {
    LibStat.setHarmony(components, id, Stat(value, 0, 0, 0));
  }

  function setHealth(IUintComp components, uint256 id, int32 value) internal {
    LibStat.setHealth(components, id, Stat(value, 0, 0, 0));
  }

  function setPower(IUintComp components, uint256 id, int32 value) internal {
    LibStat.setPower(components, id, Stat(value, 0, 0, 0));
  }

  function setSlots(IUintComp components, uint256 id, int32 value) internal {
    LibStat.setSlots(components, id, Stat(value, 0, 0, 0));
  }

  function setViolence(IUintComp components, uint256 id, int32 value) internal {
    LibStat.setViolence(components, id, Stat(value, 0, 0, 0));
  }

  function unsetAffinity(IUintComp components, uint256 id) internal {
    AffinityComponent comp = AffinityComponent(getAddressById(components, AffinityCompID));
    if (comp.has(id)) comp.remove(id);
  }

  /////////////////
  // GETTERS

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddressById(components, NameCompID)).getValue(id);
  }

  function getBodyIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexBodyComponent(getAddressById(components, IndexBodyCompID)).getValue(id);
  }

  function getBackgroundIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexBackgroundComponent(getAddressById(components, IndexBackgroundCompID)).getValue(id);
  }

  function getColorIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexColorComponent(getAddressById(components, IndexColorCompID)).getValue(id);
  }

  function getFaceIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexFaceComponent(getAddressById(components, IndexFaceCompID)).getValue(id);
  }

  function getHandIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexHandComponent(getAddressById(components, IndexHandCompID)).getValue(id);
  }

  function getTraitIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexTraitComponent(getAddressById(components, IndexTraitCompID)).getValue(id);
  }

  // Get the name of an entity's set Background (identified by IndexBackground value)
  function getBackgroundNameOf(
    IUintComp components,
    uint256 id
  ) internal view returns (string memory) {
    return getName(components, getBackgroundOf(components, id));
  }

  // Get the name of an entity's set Body (identified by IndexBody value)
  function getBodyNameOf(IUintComp components, uint256 id) internal view returns (string memory) {
    return getName(components, getBodyOf(components, id));
  }

  // Get the name of an entity's set Color (identified by IndexColor value)
  function getColorNameOf(IUintComp components, uint256 id) internal view returns (string memory) {
    return getName(components, getColorOf(components, id));
  }

  // Get the name of an entity's set Face (identified by IndexFace value)
  function getFaceNameOf(IUintComp components, uint256 id) internal view returns (string memory) {
    return getName(components, getFaceOf(components, id));
  }

  // Get the name of an entity's set Hand (identified by IndexHand value)
  function getHandNameOf(IUintComp components, uint256 id) internal view returns (string memory) {
    return getName(components, getHandOf(components, id));
  }

  /////////////////
  // RARITY WEIGHTS

  // Get background rarities as key value pair arrays
  function getBackgroundRarities(
    IUintComp components
  ) internal view returns (uint32[] memory keys, uint256[] memory weights) {
    uint256[] memory ids = getAllOfType(components, IndexBackgroundCompID);
    keys = new uint32[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      keys[i] = getBackgroundIndex(components, ids[i]);
    }
    weights = LibRarity.getWeights(components, ids);
  }

  // Get body rarities as key value pair arrays
  function getBodyRarities(
    IUintComp components
  ) internal view returns (uint32[] memory keys, uint256[] memory weights) {
    uint256[] memory ids = getAllOfType(components, IndexBodyCompID);
    keys = new uint32[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      keys[i] = getBodyIndex(components, ids[i]);
    }
    weights = LibRarity.getWeights(components, ids);
  }

  // Get color rarities as key value pair arrays
  function getColorRarities(
    IUintComp components
  ) internal view returns (uint32[] memory keys, uint256[] memory weights) {
    uint256[] memory ids = getAllOfType(components, IndexColorCompID);
    keys = new uint32[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      keys[i] = getColorIndex(components, ids[i]);
    }
    weights = LibRarity.getWeights(components, ids);
  }

  // Get face rarities as key value pair arrays
  function getFaceRarities(
    IUintComp components
  ) internal view returns (uint32[] memory keys, uint256[] memory weights) {
    uint256[] memory ids = getAllOfType(components, IndexFaceCompID);
    keys = new uint32[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      keys[i] = getFaceIndex(components, ids[i]);
    }
    weights = LibRarity.getWeights(components, ids);
  }

  // Get hand rarities as key value pair arrays
  function getHandRarities(
    IUintComp components
  ) internal view returns (uint32[] memory keys, uint256[] memory weights) {
    uint256[] memory ids = getAllOfType(components, IndexHandCompID);
    keys = new uint32[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      keys[i] = getHandIndex(components, ids[i]);
    }
    weights = LibRarity.getWeights(components, ids);
  }

  /////////////////
  // QUERIES

  // Get the number of Trait registry entries
  // NOTE: returns uint32 because this is only used to increment the trait index
  function getTraitCount(IUintComp components) internal view returns (uint32) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexTraitCompID), "");
    return uint32(LibQuery.query(fragments).length);
  }

  // Get the Background TraitRegistry EntityID of a given entity
  function getBackgroundOf(IUintComp components, uint256 id) internal view returns (uint256) {
    uint32 index = getBackgroundIndex(components, id);
    return getByBackgroundIndex(components, index);
  }

  // Get the Body TraitRegistry EntityID of a given entity
  function getBodyOf(IUintComp components, uint256 id) internal view returns (uint256) {
    uint32 index = getBodyIndex(components, id);
    return getByBodyIndex(components, index);
  }

  // Get the Color TraitRegistry EntityID of a given entity
  function getColorOf(IUintComp components, uint256 id) internal view returns (uint256) {
    uint32 index = getColorIndex(components, id);
    return getByColorIndex(components, index);
  }

  // Get the Face TraitRegistry EntityID of a given entity
  function getFaceOf(IUintComp components, uint256 id) internal view returns (uint256) {
    uint32 index = getFaceIndex(components, id);
    return getByFaceIndex(components, index);
  }

  // Get the Hand TraitRegistry EntityID of a given entity
  function getHandOf(IUintComp components, uint256 id) internal view returns (uint256) {
    uint32 index = getHandIndex(components, id);
    return getByHandIndex(components, index);
  }

  // Get the registry entry by Trait index
  function getByTraitIndex(
    IUintComp components,
    uint32 traitIndex
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

  // Get the registry entry by background index
  function getByBackgroundIndex(
    IUintComp components,
    uint32 backgroundIndex
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

  // Get the registry entry by body index
  function getByBodyIndex(
    IUintComp components,
    uint32 bodyIndex
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

  // Get the registry entry by Color index
  function getByColorIndex(
    IUintComp components,
    uint32 colorIndex
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

  // Get the registry entry by Face index
  function getByFaceIndex(
    IUintComp components,
    uint32 faceIndex
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

  // Get the registry entry by Hand index
  function getByHandIndex(
    IUintComp components,
    uint32 handIndex
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

  // gets all registry entities of type. requires the indexComponent
  // mostly used internally
  function getAllOfType(
    IUintComp components,
    uint256 indexComponentID
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexTraitCompID), "");
    fragments[2] = QueryFragment(QueryType.Has, getComponentById(components, indexComponentID), "");
    uint256[] memory results = LibQuery.query(fragments);
    return results;
  }
}
