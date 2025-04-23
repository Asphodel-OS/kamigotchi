// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { Stat } from "solecs/components/types/Stat.sol";

import { Uint32Component } from "solecs/components/Uint32Component.sol";
import { AffinityComponent, ID as AffinityCompID } from "components/AffinityComponent.sol";
import { IDAnchorComponent, ID as IDAnchorCompID } from "components/IDAnchorComponent.sol";
import { IndexBodyComponent, ID as IndexBodyCompID } from "components/IndexBodyComponent.sol";
import { IndexBackgroundComponent, ID as IndexBackgroundCompID } from "components/IndexBackgroundComponent.sol";
import { IndexColorComponent, ID as IndexColorCompID } from "components/IndexColorComponent.sol";
import { IndexFaceComponent, ID as IndexFaceCompID } from "components/IndexFaceComponent.sol";
import { IndexHandComponent, ID as IndexHandCompID } from "components/IndexHandComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { HealthComponent, ID as HealthCompID } from "components/HealthComponent.sol";
import { HarmonyComponent, ID as HarmonyCompID } from "components/HarmonyComponent.sol";
import { PowerComponent, ID as PowerCompID } from "components/PowerComponent.sol";
import { SlotsComponent, ID as SlotsCompID } from "components/SlotsComponent.sol";
import { ViolenceComponent, ID as ViolenceCompID } from "components/ViolenceComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { RarityComponent, ID as RarityCompID } from "components/RarityComponent.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";
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

struct TraitStats {
  int32 health;
  int32 power;
  int32 violence;
  int32 harmony;
  int32 slots;
}

library LibTraitRegistry {
  using LibString for string;

  /////////////////
  // INTERACTIONS

  function create(
    IUintComp components,
    uint32 index,
    string memory _type,
    TraitValues memory vals
  ) internal returns (uint256 id) {
    require(getByIndex(components, index, _type) == 0, "LibRegTrait: trait alr exists");
    require(vals.rarity > 0, "LibTraitRegistry: rarity must be > 0");

    id = genID(index, _type);
    LibEntityType.set(components, id, "TRAIT");
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).set(id);
    setIndex(components, id, index, _type);
    setReverseMappingPtr(components, id, _type);
    setName(components, id, vals.name);

    if (vals.health > 0) setHealth(components, id, vals.health);
    if (vals.power > 0) setPower(components, id, vals.power);
    if (vals.violence > 0) setViolence(components, id, vals.violence);
    if (vals.harmony > 0) setHarmony(components, id, vals.harmony);
    if (vals.slots > 0) setSlots(components, id, vals.slots);
    RarityComponent(getAddrByID(components, RarityCompID)).set(id, vals.rarity);
    if (!LibString.eq(vals.affinity, "")) setAffinity(components, id, vals.affinity);
  }

  function remove(IUintComp components, uint256 id) internal {
    LibEntityType.remove(components, id);
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).remove(id);
    NameComponent(getAddrByID(components, NameCompID)).remove(id);
    IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).remove(id);
    IndexBodyComponent(getAddrByID(components, IndexBodyCompID)).remove(id);
    IndexBackgroundComponent(getAddrByID(components, IndexBackgroundCompID)).remove(id);
    IndexColorComponent(getAddrByID(components, IndexColorCompID)).remove(id);
    IndexFaceComponent(getAddrByID(components, IndexFaceCompID)).remove(id);
    IndexHandComponent(getAddrByID(components, IndexHandCompID)).remove(id);

    LibStat.unsetHealth(components, id);
    LibStat.unsetPower(components, id);
    LibStat.unsetViolence(components, id);
    LibStat.unsetHarmony(components, id);
    LibStat.unsetSlots(components, id);
    RarityComponent(getAddrByID(components, RarityCompID)).remove(id);
    AffinityComponent(getAddrByID(components, AffinityCompID)).remove(id);
  }

  /////////////////
  // SETTERS

  function setIndex(IUintComp components, uint256 id, uint32 index, string memory _type) internal {
    getIndexComp(components, _type).set(id, index);
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
    IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).set(id, genReverseMappingPtr(_type));
  }

  function setSlots(IUintComp components, uint256 id, int32 value) internal {
    LibStat.setSlots(components, id, Stat(value, 0, 0, 0));
  }

  function setViolence(IUintComp components, uint256 id, int32 value) internal {
    LibStat.setViolence(components, id, Stat(value, 0, 0, 0));
  }

  /////////////////
  // GETTERS

  /// @notice gets registry entity by index
  function getByIndex(
    IUintComp components,
    uint32 index,
    string memory _type
  ) internal view returns (uint256) {
    checkType(_type); // usually implicitly checked elsewhere
    uint256 id = genID(index, _type);
    return LibEntityType.isShape(components, id, "TRAIT") ? id : 0;
  }

  /// @notice returns the registryID from an entity
  function getByEntity(
    IUintComp components,
    uint256 entityID,
    string memory _type
  ) internal view returns (uint256) {
    uint32 index = getIndex(components, entityID, _type);
    return getByIndex(components, index, _type);
  }

  function getIndex(
    IUintComp components,
    uint256 id,
    string memory _type
  ) internal view returns (uint32) {
    return getIndexComp(components, _type).get(id);
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

  function getIndices(
    IUintComp components,
    uint256[] memory ids,
    string memory _type
  ) internal view returns (uint32[] memory) {
    Uint32Component comp = getIndexComp(components, _type);
    return comp.get(ids);
  }

  function getNameOf(
    IUintComp components,
    uint256 id,
    string memory _type
  ) internal view returns (string memory) {
    uint256 regID = getByEntity(components, id, _type);
    return NameComponent(getAddrByID(components, NameCompID)).get(regID);
  }

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddrByID(components, NameCompID)).get(id);
  }

  function getStatsByIndex(
    IUintComp components,
    uint32 index,
    string memory _type
  ) internal view returns (TraitStats memory) {
    uint256 regID = getByIndex(components, index, _type);
    return
      TraitStats(
        HealthComponent(getAddrByID(components, HealthCompID)).safeGet(regID).base,
        PowerComponent(getAddrByID(components, PowerCompID)).safeGet(regID).base,
        ViolenceComponent(getAddrByID(components, ViolenceCompID)).safeGet(regID).base,
        HarmonyComponent(getAddrByID(components, HarmonyCompID)).safeGet(regID).base,
        SlotsComponent(getAddrByID(components, SlotsCompID)).safeGet(regID).base
      );
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

  function getRarities(
    IUintComp components,
    string memory _type
  ) internal view returns (uint32[] memory keys, uint256[] memory weights) {
    uint256[] memory ids = getAllOfType(components, _type);
    keys = getIndices(components, ids, _type);
    weights = getWeights(components, ids);
  }

  /////////////////
  // CALCS

  function addStats(
    TraitStats memory base,
    TraitStats memory toAdd
  ) internal pure returns (TraitStats memory) {
    return
      TraitStats(
        base.health + toAdd.health,
        base.power + toAdd.power,
        base.violence + toAdd.violence,
        base.harmony + toAdd.harmony,
        base.slots + toAdd.slots
      );
  }

  /////////////////
  // QUERIES

  // gets all registry entities of type. requires the indexComponent
  // mostly used internally
  function getAllOfType(
    IUintComp components,
    string memory _type
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](2);

    fragments[0] = QueryFragment(
      QueryType.HasValue,
      getCompByID(components, IDAnchorCompID),
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

  function getIndexComp(
    IUintComp components,
    string memory _type
  ) internal view returns (Uint32Component) {
    if (_type.eq("BACKGROUND"))
      return Uint32Component(getAddrByID(components, IndexBackgroundCompID));
    else if (_type.eq("BODY")) return Uint32Component(getAddrByID(components, IndexBodyCompID));
    else if (_type.eq("COLOR")) return Uint32Component(getAddrByID(components, IndexColorCompID));
    else if (_type.eq("FACE")) return Uint32Component(getAddrByID(components, IndexFaceCompID));
    else if (_type.eq("HAND")) return Uint32Component(getAddrByID(components, IndexHandCompID));
    else revert("LibTraitRegistry: unknown type");
  }

  /// @notice get trait types in ordered array
  function getTypeNames() internal pure returns (string[] memory names) {
    names = new string[](5);
    names[0] = "FACE";
    names[1] = "HAND";
    names[2] = "BODY";
    names[3] = "BACKGROUND";
    names[4] = "COLOR";
  }

  function checkType(string memory _type) internal pure {
    require(
      _type.eq("BACKGROUND") ||
        _type.eq("BODY") ||
        _type.eq("COLOR") ||
        _type.eq("FACE") ||
        _type.eq("HAND"),
      "LibTraitRegistry: unknown type"
    );
  }
}
