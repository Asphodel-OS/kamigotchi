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
import { IndexFaceComponent, ID as IndexFaceCompID } from "components/IndexFaceComponent.sol";
import { IndexHandComponent, ID as IndexHandCompID } from "components/IndexHandComponent.sol";
import { IndexTraitComponent, ID as IndexTraitCompID } from "components/IndexTraitComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { RarityComponent, ID as RarityCompID } from "components/RarityComponent.sol";
import { LibStat } from "libraries/LibStat.sol";
import { LibRandom } from "libraries/LibRandom.sol";

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
    uint256 slots,
    uint256 rarity,
    string memory affinity
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint256 TraitIndex = getTraitCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    setTraitIndex(components, id, TraitIndex);
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
    uint256 backgroundIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots,
    uint256 rarity
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
    uint256 colorIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots,
    uint256 rarity
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint256 TraitIndex = getTraitCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    setTraitIndex(components, id, TraitIndex);
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
    uint256 faceIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots,
    uint256 rarity
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint256 TraitIndex = getTraitCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    setTraitIndex(components, id, TraitIndex);
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
    uint256 handIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots,
    uint256 rarity,
    string memory affinity
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    uint256 TraitIndex = getTraitCount(components) + 1;
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    setTraitIndex(components, id, TraitIndex);
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
    uint256 bodyIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots,
    uint256 rarity,
    string memory affinity
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

    if (rarity > 0) LibStat.setRarity(components, id, rarity);
    else LibStat.removeRarity(components, id);

    if (!LibString.eq(affinity, "")) LibStat.setAffinity(components, id, affinity);
    else LibStat.removeAffinity(components, id);

    return id;
  }

  // Set the field values of an existing background trait registry entry
  // TODO: remove set pattern
  function setBackground(
    IUintComp components,
    uint256 backgroundIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots,
    uint256 rarity
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

    if (rarity > 0) LibStat.setRarity(components, id, rarity);
    else LibStat.removeRarity(components, id);

    return id;
  }

  // Set the field values of an existing color trait registry entry
  // TODO: remove set pattern
  function setColor(
    IUintComp components,
    uint256 colorIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots,
    uint256 rarity
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

    if (rarity > 0) LibStat.setRarity(components, id, rarity);
    else LibStat.removeRarity(components, id);

    return id;
  }

  // Set the field values of an existing face trait registry entry
  // TODO: remove set pattern
  function setFace(
    IUintComp components,
    uint256 faceIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots,
    uint256 rarity
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

    if (rarity > 0) LibStat.setRarity(components, id, rarity);
    else LibStat.removeRarity(components, id);

    return id;
  }

  // Set the field values of an existing hand trait registry entry
  // TODO: remove set pattern
  function setHand(
    IUintComp components,
    uint256 handIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots,
    uint256 rarity,
    string memory affinity
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

    if (rarity > 0) LibStat.setRarity(components, id, rarity);
    else LibStat.removeRarity(components, id);

    if (!LibString.eq(affinity, "")) LibStat.setAffinity(components, id, affinity);
    else LibStat.removeAffinity(components, id);

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

    LibStat.removeHealth(components, id);
    LibStat.removePower(components, id);
    LibStat.removeViolence(components, id);
    LibStat.removeHarmony(components, id);
    LibStat.removeSlots(components, id);
    LibStat.removeRarity(components, id);
    LibStat.removeAffinity(components, id);
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
  // GETTERS (COMPONENT VALUES)

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddressById(components, NameCompID)).getValue(id);
  }

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
  ) internal view returns (uint256[] memory keys, uint256[] memory weights) {
    uint256[] memory ids = getAllOfType(components, IndexBackgroundCompID);
    keys = new uint256[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      keys[i] = getBackgroundIndex(components, ids[i]);
    }
    weights = LibStat.getRarityWeights(components, ids);
  }

  // Get body rarities as key value pair arrays
  function getBodyRarities(
    IUintComp components
  ) internal view returns (uint256[] memory keys, uint256[] memory weights) {
    uint256[] memory ids = getAllOfType(components, IndexBodyCompID);
    keys = new uint256[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      keys[i] = getBodyIndex(components, ids[i]);
    }
    weights = LibStat.getRarityWeights(components, ids);
  }

  // Get color rarities as key value pair arrays
  function getColorRarities(
    IUintComp components
  ) internal view returns (uint256[] memory keys, uint256[] memory weights) {
    uint256[] memory ids = getAllOfType(components, IndexColorCompID);
    keys = new uint256[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      keys[i] = getColorIndex(components, ids[i]);
    }
    weights = LibStat.getRarityWeights(components, ids);
  }

  // Get face rarities as key value pair arrays
  function getFaceRarities(
    IUintComp components
  ) internal view returns (uint256[] memory keys, uint256[] memory weights) {
    uint256[] memory ids = getAllOfType(components, IndexFaceCompID);
    keys = new uint256[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      keys[i] = getFaceIndex(components, ids[i]);
    }
    weights = LibStat.getRarityWeights(components, ids);
  }

  // Get hand rarities as key value pair arrays
  function getHandRarities(
    IUintComp components
  ) internal view returns (uint256[] memory keys, uint256[] memory weights) {
    uint256[] memory ids = getAllOfType(components, IndexHandCompID);
    keys = new uint256[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      keys[i] = getHandIndex(components, ids[i]);
    }
    weights = LibStat.getRarityWeights(components, ids);
  }

  /////////////////
  // QUERIES

  // Get the number of Trait registry entries
  function getTraitCount(IUintComp components) internal view returns (uint256) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexTraitCompID), "");
    return LibQuery.query(fragments).length;
  }

  // Get the Background TraitRegistry EntityID of a given entity
  function getBackgroundOf(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 index = getBackgroundIndex(components, id);
    return getByBackgroundIndex(components, index);
  }

  // Get the Body TraitRegistry EntityID of a given entity
  function getBodyOf(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 index = getBodyIndex(components, id);
    return getByBodyIndex(components, index);
  }

  // Get the Color TraitRegistry EntityID of a given entity
  function getColorOf(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 index = getColorIndex(components, id);
    return getByColorIndex(components, index);
  }

  // Get the Face TraitRegistry EntityID of a given entity
  function getFaceOf(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 index = getFaceIndex(components, id);
    return getByFaceIndex(components, index);
  }

  // Get the Hand TraitRegistry EntityID of a given entity
  function getHandOf(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 index = getHandIndex(components, id);
    return getByHandIndex(components, index);
  }

  // Get the registry entry by Trait index
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

  // Get the registry entry by background index
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

  // Get the registry entry by body index
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

  // Get the registry entry by Color index
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

  // Get the registry entry by Face index
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

  // Get the registry entry by Hand index
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
