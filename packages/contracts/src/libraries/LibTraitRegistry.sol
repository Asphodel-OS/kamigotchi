// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { Stat } from "solecs/components/types/Stat.sol";

import { AffinityComponent, ID as AffinityCompID } from "components/AffinityComponent.sol";
import { ForComponent, ID as ForCompID } from "components/ForComponent.sol";
import { IndexBodyComponent, ID as IndexBodyCompID } from "components/IndexBodyComponent.sol";
import { IndexBackgroundComponent, ID as IndexBackgroundCompID } from "components/IndexBackgroundComponent.sol";
import { IndexColorComponent, ID as IndexColorCompID } from "components/IndexColorComponent.sol";
import { IndexFaceComponent, ID as IndexFaceCompID } from "components/IndexFaceComponent.sol";
import { IndexHandComponent, ID as IndexHandCompID } from "components/IndexHandComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { RarityComponent, ID as RarityCompID } from "components/RarityComponent.sol";

import { LibRandom } from "libraries/utils/LibRandom.sol";
import { LibStat } from "libraries/LibStat.sol";

// LibTraitRegistry is based heavily off LibItem, but is used for traits.
// IndexTrait is the automatically incremented domain index, but traits are
// more commonly identified by the specific index (e.g. body, hand, color index)

struct TraitValues {
  string name;
  int32 health;
  int32 power;
  int32 violence;
  int32 harmony;
  int32 slots;
  uint256 rarity;
  string affinity;
}

library LibTraitRegistry {
  /////////////////
  // INTERACTIONS

  // Create a Registry entry for a Body trait. (e.g. butterfly, cube)
  function createBody(
    IUintComp components,
    uint32 bodyIndex,
    TraitValues memory values
  ) internal returns (uint256) {
    require(getByBodyIndex(components, bodyIndex) == 0, "LibRegTrait: body used");

    uint256 id = genID(bodyIndex, "BODY");
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).set(id);
    setBodyIndex(components, id, bodyIndex);
    setReverseMappingPtr(components, id, "BODY");

    createTrait(components, id, values);
    return id;
  }

  // Create a Registry entry for a Background trait. (e.g. green, blue)
  function createBackground(
    IUintComp components,
    uint32 backgroundIndex,
    TraitValues memory values
  ) internal returns (uint256) {
    require(getByBackgroundIndex(components, backgroundIndex) == 0, "LibRegTrait: background used");

    uint256 id = genID(backgroundIndex, "BACKGROUND");
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).set(id);
    setBackgroundIndex(components, id, backgroundIndex);
    setReverseMappingPtr(components, id, "BACKGROUND");

    createTrait(components, id, values);
    return id;
  }

  // Create a Registry entry for a color trait. (e.g. green, blue)
  function createColor(
    IUintComp components,
    uint32 colorIndex,
    TraitValues memory values
  ) internal returns (uint256) {
    require(getByColorIndex(components, colorIndex) == 0, "LibRegTrait: color used");

    uint256 id = genID(colorIndex, "COLOR");
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).set(id);
    setColorIndex(components, id, colorIndex);
    setReverseMappingPtr(components, id, "COLOR");

    createTrait(components, id, values);
    return id;
  }

  // Create a Registry entry for a Face trait. (e.g. green, blue)
  function createFace(
    IUintComp components,
    uint32 faceIndex,
    TraitValues memory values
  ) internal returns (uint256) {
    require(getByFaceIndex(components, faceIndex) == 0, "LibRegTrait: face used");

    uint256 id = genID(faceIndex, "FACE");
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).set(id);
    setFaceIndex(components, id, faceIndex);
    setReverseMappingPtr(components, id, "FACE");

    createTrait(components, id, values);
    return id;
  }

  // Create a Registry entry for a Hand trait. (e.g. green, blue)
  function createHand(
    IUintComp components,
    uint32 handIndex,
    TraitValues memory values
  ) internal returns (uint256) {
    require(getByHandIndex(components, handIndex) == 0, "LibRegTrait: hand used");

    uint256 id = genID(handIndex, "HAND");
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).set(id);
    setHandIndex(components, id, handIndex);
    setReverseMappingPtr(components, id, "HAND");

    createTrait(components, id, values);
    return id;
  }

  function createTrait(
    IUintComp components,
    uint256 id,
    TraitValues memory values
  ) internal returns (uint256) {
    setName(components, id, values.name);
    if (values.health > 0) setHealth(components, id, values.health);
    if (values.power > 0) setPower(components, id, values.power);
    if (values.violence > 0) setViolence(components, id, values.violence);
    if (values.harmony > 0) setHarmony(components, id, values.harmony);
    if (values.slots > 0) setSlots(components, id, values.slots);
    if (values.rarity > 0)
      RarityComponent(getAddrByID(components, RarityCompID)).set(id, values.rarity);
    if (!LibString.eq(values.affinity, "")) setAffinity(components, id, values.affinity);
  }

  function remove(IUintComp components, uint256 id) internal {
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).remove(id);
    NameComponent(getAddrByID(components, NameCompID)).remove(id);
    ForComponent(getAddrByID(components, ForCompID)).remove(id);
    if (isBody(components, id))
      IndexBodyComponent(getAddrByID(components, IndexBodyCompID)).remove(id);
    if (isBackground(components, id))
      IndexBackgroundComponent(getAddrByID(components, IndexBackgroundCompID)).remove(id);
    if (isColor(components, id))
      IndexColorComponent(getAddrByID(components, IndexColorCompID)).remove(id);
    if (isFace(components, id))
      IndexFaceComponent(getAddrByID(components, IndexFaceCompID)).remove(id);
    if (isHand(components, id))
      IndexHandComponent(getAddrByID(components, IndexHandCompID)).remove(id);

    LibStat.unsetHealth(components, id);
    LibStat.unsetPower(components, id);
    LibStat.unsetViolence(components, id);
    LibStat.unsetHarmony(components, id);
    LibStat.unsetSlots(components, id);
    RarityComponent(getAddrByID(components, RarityCompID)).remove(id);
    unsetAffinity(components, id);
  }

  /////////////////
  // CHECKERS

  function isRegistry(IUintComp components, uint256 id) internal view returns (bool) {
    return IsRegistryComponent(getAddrByID(components, IsRegCompID)).has(id);
  }

  function isBody(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexBodyComponent(getAddrByID(components, IndexBodyCompID)).has(id);
  }

  function isBackground(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexBackgroundComponent(getAddrByID(components, IndexBackgroundCompID)).has(id);
  }

  function isColor(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexColorComponent(getAddrByID(components, IndexColorCompID)).has(id);
  }

  function isFace(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexFaceComponent(getAddrByID(components, IndexFaceCompID)).has(id);
  }

  function isHand(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexHandComponent(getAddrByID(components, IndexHandCompID)).has(id);
  }

  /////////////////
  // SETTERS

  function setBodyIndex(IUintComp components, uint256 id, uint32 bodyIndex) internal {
    IndexBodyComponent(getAddrByID(components, IndexBodyCompID)).set(id, bodyIndex);
  }

  function setBackgroundIndex(IUintComp components, uint256 id, uint32 backgroundIndex) internal {
    IndexBackgroundComponent(getAddrByID(components, IndexBackgroundCompID)).set(
      id,
      backgroundIndex
    );
  }

  function setColorIndex(IUintComp components, uint256 id, uint32 colorIndex) internal {
    IndexColorComponent(getAddrByID(components, IndexColorCompID)).set(id, colorIndex);
  }

  function setFaceIndex(IUintComp components, uint256 id, uint32 faceIndex) internal {
    IndexFaceComponent(getAddrByID(components, IndexFaceCompID)).set(id, faceIndex);
  }

  function setHandIndex(IUintComp components, uint256 id, uint32 handIndex) internal {
    IndexHandComponent(getAddrByID(components, IndexHandCompID)).set(id, handIndex);
  }

  function setAffinity(IUintComp components, uint256 id, string memory value) internal {
    AffinityComponent(getAddrByID(components, AffinityCompID)).set(id, value);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddrByID(components, NameCompID)).set(id, name);
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

  function setReverseMappingPtr(IUintComp components, uint256 id, string memory _type) internal {
    ForComponent(getAddrByID(components, ForCompID)).set(id, genReverseMappingPtr(_type));
  }

  function setSlots(IUintComp components, uint256 id, int32 value) internal {
    LibStat.setSlots(components, id, Stat(value, 0, 0, 0));
  }

  function setViolence(IUintComp components, uint256 id, int32 value) internal {
    LibStat.setViolence(components, id, Stat(value, 0, 0, 0));
  }

  function unsetAffinity(IUintComp components, uint256 id) internal {
    AffinityComponent comp = AffinityComponent(getAddrByID(components, AffinityCompID));
    if (comp.has(id)) comp.remove(id);
  }

  /////////////////
  // GETTERS

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddrByID(components, NameCompID)).get(id);
  }

  function getBodyIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexBodyComponent(getAddrByID(components, IndexBodyCompID)).get(id);
  }

  function getBackgroundIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexBackgroundComponent(getAddrByID(components, IndexBackgroundCompID)).get(id);
  }

  function getColorIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexColorComponent(getAddrByID(components, IndexColorCompID)).get(id);
  }

  function getFaceIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexFaceComponent(getAddrByID(components, IndexFaceCompID)).get(id);
  }

  function getHandIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexHandComponent(getAddrByID(components, IndexHandCompID)).get(id);
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

  function getWeights(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (uint256[] memory) {
    uint256[] memory weights = RarityComponent(getAddrByID(components, RarityCompID)).get(ids);
    return LibRandom.processWeightedRarity(weights);
  }

  /////////////////
  // RARITY WEIGHTS

  // Get background rarities as key value pair arrays
  function getBackgroundRarities(
    IUintComp components
  ) internal view returns (uint32[] memory keys, uint256[] memory weights) {
    uint256[] memory ids = getAllOfType(components, "BACKGROUND");
    keys = new uint32[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      keys[i] = getBackgroundIndex(components, ids[i]);
    }
    weights = getWeights(components, ids);
  }

  // Get body rarities as key value pair arrays
  function getBodyRarities(
    IUintComp components
  ) internal view returns (uint32[] memory keys, uint256[] memory weights) {
    uint256[] memory ids = getAllOfType(components, "BODY");
    keys = new uint32[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      keys[i] = getBodyIndex(components, ids[i]);
    }
    weights = getWeights(components, ids);
  }

  // Get color rarities as key value pair arrays
  function getColorRarities(
    IUintComp components
  ) internal view returns (uint32[] memory keys, uint256[] memory weights) {
    uint256[] memory ids = getAllOfType(components, "COLOR");
    keys = new uint32[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      keys[i] = getColorIndex(components, ids[i]);
    }
    weights = getWeights(components, ids);
  }

  // Get face rarities as key value pair arrays
  function getFaceRarities(
    IUintComp components
  ) internal view returns (uint32[] memory keys, uint256[] memory weights) {
    uint256[] memory ids = getAllOfType(components, "FACE");
    keys = new uint32[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      keys[i] = getFaceIndex(components, ids[i]);
    }
    weights = getWeights(components, ids);
  }

  // Get hand rarities as key value pair arrays
  function getHandRarities(
    IUintComp components
  ) internal view returns (uint32[] memory keys, uint256[] memory weights) {
    uint256[] memory ids = getAllOfType(components, "HAND");
    keys = new uint32[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      keys[i] = getHandIndex(components, ids[i]);
    }
    weights = getWeights(components, ids);
  }

  /////////////////
  // QUERIES

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

  // Get the registry entry by background index
  function getByBackgroundIndex(
    IUintComp components,
    uint32 backgroundIndex
  ) internal view returns (uint256 result) {
    result = genID(backgroundIndex, "BACKGROUND");
    if (!IndexBackgroundComponent(getAddrByID(components, IndexBackgroundCompID)).has(result))
      result = 0;
  }

  // Get the registry entry by body index
  function getByBodyIndex(
    IUintComp components,
    uint32 bodyIndex
  ) internal view returns (uint256 result) {
    result = genID(bodyIndex, "BODY");
    if (!IndexBodyComponent(getAddrByID(components, IndexBodyCompID)).has(result)) result = 0;
  }

  // Get the registry entry by Color index
  function getByColorIndex(
    IUintComp components,
    uint32 colorIndex
  ) internal view returns (uint256 result) {
    result = genID(colorIndex, "COLOR");
    if (!IndexColorComponent(getAddrByID(components, IndexColorCompID)).has(result)) result = 0;
  }

  // Get the registry entry by Face index
  function getByFaceIndex(
    IUintComp components,
    uint32 faceIndex
  ) internal view returns (uint256 result) {
    result = genID(faceIndex, "FACE");
    if (!IndexFaceComponent(getAddrByID(components, IndexFaceCompID)).has(result)) result = 0;
  }

  // Get the registry entry by Hand index
  function getByHandIndex(
    IUintComp components,
    uint32 handIndex
  ) internal view returns (uint256 result) {
    result = genID(handIndex, "HAND");
    if (!IndexHandComponent(getAddrByID(components, IndexHandCompID)).has(result)) result = 0;
  }

  // gets all registry entities of type. requires the indexComponent
  // mostly used internally
  function getAllOfType(
    IUintComp components,
    string memory _type
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](2);

    fragments[0] = QueryFragment(
      QueryType.HasValue,
      getCompByID(components, ForCompID),
      abi.encode(genReverseMappingPtr(_type))
    );
    fragments[1] = QueryFragment(QueryType.Has, getCompByID(components, IsRegCompID), "");

    return LibQuery.query(fragments);
  }

  /////////////////
  // UTILS

  /// @notice Gens the ID of a registry entry
  function genID(uint32 index, string memory _type) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("registry.trait", _type, index)));
  }

  /// @notice Gens the pointer to trait type - used for querying AllOfType
  function genReverseMappingPtr(string memory _type) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("registry.trait.type", _type)));
  }
}
