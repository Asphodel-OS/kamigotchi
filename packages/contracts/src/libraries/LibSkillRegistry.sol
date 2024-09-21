// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { CostComponent, ID as CostCompID } from "components/CostComponent.sol";
import { DescriptionComponent, ID as DescCompID } from "components/DescriptionComponent.sol";
import { ForComponent, ID as ForCompID } from "components/ForComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IndexSkillComponent, ID as IndexSkillCompID } from "components/IndexSkillComponent.sol";
import { IDPointerComponent, ID as IDPointerCompID } from "components/IDPointerComponent.sol";
import { IsEffectComponent, ID as IsEffectCompID } from "components/IsEffectComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { IsSkillComponent, ID as IsSkillCompID } from "components/IsSkillComponent.sol";
import { ValueSignedComponent, ID as ValueSignedCompID } from "components/ValueSignedComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { MaxComponent, ID as MaxCompID } from "components/MaxComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { SubtypeComponent, ID as SubtypeCompID } from "components/SubtypeComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

import { LibArray } from "libraries/utils/LibArray.sol";
import { LibFor } from "libraries/utils/LibFor.sol";
import { LibConditional } from "libraries/LibConditional.sol";

/// @notice A registry for Skill related entities
/// @dev Skills are not copied onto entities, only referenced when assigning the effect
library LibSkillRegistry {
  /////////////////
  // INTERACTIONS

  /**
   * @notice Create a registry entry for a Skill
   * @dev entity shape:
   *      - skillIndex
   *      - isRegistry + isSkill
   *      - type
   *      - name
   *      - cost
   *      - max
   *      - mediaURI
   *      - for (type of entity - likely Pet/Account)
   *      - skill tree (optional) [subtype component]
   */
  function create(
    IUintComp components,
    uint32 skillIndex,
    string memory for_,
    string memory type_,
    string memory name,
    string memory description,
    uint256 cost,
    uint256 max,
    string memory media
  ) internal returns (uint256 id) {
    id = genID(skillIndex);
    setIsRegistry(components, id);
    setIsSkill(components, id); // TODO: change to EntityType
    setSkillIndex(components, id, skillIndex);
    setType(components, id, type_);
    setName(components, id, name);
    setCost(components, id, cost);
    setMax(components, id, max);
    setMediaURI(components, id, media);
    DescriptionComponent(getAddrByID(components, DescCompID)).set(id, description);

    LibFor.setFromString(components, id, for_);
  }

  function addEffect(
    IWorld world,
    IUintComp components,
    uint32 skillIndex,
    string memory type_,
    int256 value
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    setConditionOwner(components, id, genEffectPtr(skillIndex));

    setIsRegistry(components, id);
    setIsEffect(components, id);
    setSkillIndex(components, id, skillIndex);
    setType(components, id, type_);
    ValueSignedComponent(getAddrByID(components, ValueSignedCompID)).set(id, value);
  }

  function addRequirement(
    IWorld world,
    IUintComp components,
    uint32 skillIndex,
    string memory type_,
    string memory logicType
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    setConditionOwner(components, id, genReqPtr(skillIndex));
    LibConditional.create(components, id, type_, logicType);

    setIsRegistry(components, id);
    setSkillIndex(components, id, skillIndex);
  }

  function delete_(IUintComp components, uint256 id) internal {
    unsetIsRegistry(components, id);
    unsetIsSkill(components, id);
    unsetSkillIndex(components, id);
    unsetCost(components, id);
    unsetFor(components, id);
    unsetMax(components, id);
    unsetMediaURI(components, id);
    unsetName(components, id);
    unsetType(components, id);
    DescriptionComponent(getAddrByID(components, DescCompID)).remove(id);
  }

  function deleteEffect(IUintComp components, uint256 id) internal {
    unsetIsRegistry(components, id);
    unsetIsEffect(components, id);
    unsetSkillIndex(components, id);
    unsetType(components, id);
    unsetSubtype(components, id);
    unsetLogicType(components, id);
    unsetIndex(components, id);
    unsetBalanceSigned(components, id);
    unsetConditionOwner(components, id);
  }

  function deleteRequirement(IUintComp components, uint256 id) internal {
    unsetIsRegistry(components, id);
    unsetSkillIndex(components, id);
    unsetType(components, id);
    unsetIndex(components, id);
    unsetBalance(components, id);
    unsetConditionOwner(components, id);
  }

  /////////////////
  // SETTERS

  function setConditionOwner(IUintComp components, uint256 id, uint256 ownerID) internal {
    IDPointerComponent(getAddrByID(components, IDPointerCompID)).set(id, ownerID);
  }

  function setIsEffect(IUintComp components, uint256 id) internal {
    IsEffectComponent(getAddrByID(components, IsEffectCompID)).set(id);
  }

  function setIsRegistry(IUintComp components, uint256 id) internal {
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).set(id);
  }

  function setIsSkill(IUintComp components, uint256 id) internal {
    IsSkillComponent(getAddrByID(components, IsSkillCompID)).set(id);
  }

  function setIndex(IUintComp components, uint256 id, uint32 index) internal {
    IndexComponent(getAddrByID(components, IndexCompID)).set(id, index);
  }

  function setSkillIndex(IUintComp components, uint256 id, uint32 index) internal {
    IndexSkillComponent(getAddrByID(components, IndexSkillCompID)).set(id, index);
  }

  function setCost(IUintComp components, uint256 id, uint256 cost) internal {
    CostComponent(getAddrByID(components, CostCompID)).set(id, cost);
  }

  function setFor(IUintComp components, uint256 id, uint for_) internal {
    ForComponent(getAddrByID(components, ForCompID)).set(id, for_);
  }

  function setLogicType(IUintComp components, uint256 id, string memory logicType) internal {
    LogicTypeComponent(getAddrByID(components, LogicTypeCompID)).set(id, logicType);
  }

  function setMax(IUintComp components, uint256 id, uint256 max) internal {
    MaxComponent(getAddrByID(components, MaxCompID)).set(id, max);
  }

  function setMediaURI(IUintComp components, uint256 id, string memory mediaURI) internal {
    MediaURIComponent(getAddrByID(components, MediaURICompID)).set(id, mediaURI);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddrByID(components, NameCompID)).set(id, name);
  }

  /// @notice set the skill tree for a skill (optional)
  /// @dev uses the subtype component
  function setTree(IUintComp components, uint256 id, string memory tree, uint256 level) internal {
    setSubtype(components, id, tree);
    LevelComponent(getAddrByID(components, LevelCompID)).set(id, level);
  }

  function setSubtype(IUintComp components, uint256 id, string memory subtype) internal {
    SubtypeComponent(getAddrByID(components, SubtypeCompID)).set(id, subtype);
  }

  function setType(IUintComp components, uint256 id, string memory _type) internal {
    TypeComponent(getAddrByID(components, TypeCompID)).set(id, _type);
  }

  function setBalance(IUintComp components, uint256 id, uint256 value) internal {
    ValueComponent(getAddrByID(components, ValueCompID)).set(id, value);
  }

  /////////////////
  // UNSETTERS

  function unsetConditionOwner(IUintComp components, uint256 id) internal {
    IDPointerComponent(getAddrByID(components, IDPointerCompID)).remove(id);
  }

  function unsetIsEffect(IUintComp components, uint256 id) internal {
    IsEffectComponent(getAddrByID(components, IsEffectCompID)).remove(id);
  }

  function unsetIsRegistry(IUintComp components, uint256 id) internal {
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).remove(id);
  }

  function unsetIsSkill(IUintComp components, uint256 id) internal {
    IsSkillComponent(getAddrByID(components, IsSkillCompID)).remove(id);
  }

  function unsetIndex(IUintComp components, uint256 id) internal {
    if (IndexComponent(getAddrByID(components, IndexCompID)).has(id)) {
      IndexComponent(getAddrByID(components, IndexCompID)).remove(id);
    }
  }

  function unsetSkillIndex(IUintComp components, uint256 id) internal {
    IndexSkillComponent(getAddrByID(components, IndexSkillCompID)).remove(id);
  }

  function unsetCost(IUintComp components, uint256 id) internal {
    CostComponent(getAddrByID(components, CostCompID)).remove(id);
  }

  function unsetFor(IUintComp components, uint256 id) internal {
    ForComponent(getAddrByID(components, ForCompID)).remove(id);
  }

  function unsetLogicType(IUintComp components, uint256 id) internal {
    if (LogicTypeComponent(getAddrByID(components, LogicTypeCompID)).has(id)) {
      LogicTypeComponent(getAddrByID(components, LogicTypeCompID)).remove(id);
    }
  }

  function unsetMax(IUintComp components, uint256 id) internal {
    MaxComponent(getAddrByID(components, MaxCompID)).remove(id);
  }

  function unsetMediaURI(IUintComp components, uint256 id) internal {
    if (MediaURIComponent(getAddrByID(components, MediaURICompID)).has(id)) {
      MediaURIComponent(getAddrByID(components, MediaURICompID)).remove(id);
    }
  }

  function unsetName(IUintComp components, uint256 id) internal {
    NameComponent(getAddrByID(components, NameCompID)).remove(id);
  }

  function unsetSubtype(IUintComp components, uint256 id) internal {
    if (SubtypeComponent(getAddrByID(components, SubtypeCompID)).has(id)) {
      SubtypeComponent(getAddrByID(components, SubtypeCompID)).remove(id);
    }
  }

  function unsetTree(IUintComp components, uint256 id) internal {
    unsetSubtype(components, id);
    LevelComponent levelComp = LevelComponent(getAddrByID(components, LevelCompID));
    if (levelComp.has(id)) levelComp.remove(id);
  }

  function unsetType(IUintComp components, uint256 id) internal {
    if (TypeComponent(getAddrByID(components, TypeCompID)).has(id)) {
      TypeComponent(getAddrByID(components, TypeCompID)).remove(id);
    }
  }

  function unsetBalance(IUintComp components, uint256 id) internal {
    if (ValueComponent(getAddrByID(components, ValueCompID)).has(id)) {
      ValueComponent(getAddrByID(components, ValueCompID)).remove(id);
    }
  }

  function unsetBalanceSigned(IUintComp components, uint256 id) internal {
    if (ValueSignedComponent(getAddrByID(components, ValueSignedCompID)).has(id)) {
      ValueSignedComponent(getAddrByID(components, ValueSignedCompID)).remove(id);
    }
  }

  /////////////////
  // GETTERS

  function getBalance(IUintComp components, uint256 id) internal view returns (uint256) {
    return ValueComponent(getAddrByID(components, ValueCompID)).get(id);
  }

  function getBalanceSigned(IUintComp components, uint256 id) internal view returns (int256) {
    return ValueSignedComponent(getAddrByID(components, ValueSignedCompID)).get(id);
  }

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexComponent(getAddrByID(components, IndexCompID)).get(id);
  }

  function getSkillIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexSkillComponent(getAddrByID(components, IndexSkillCompID)).get(id);
  }

  function getCost(IUintComp components, uint256 id) internal view returns (uint256) {
    return CostComponent(getAddrByID(components, CostCompID)).get(id);
  }

  function getLogicType(IUintComp components, uint256 id) internal view returns (string memory) {
    return LogicTypeComponent(getAddrByID(components, LogicTypeCompID)).get(id);
  }

  function getMax(IUintComp components, uint256 id) internal view returns (uint256) {
    return MaxComponent(getAddrByID(components, MaxCompID)).get(id);
  }

  function getSubtype(IUintComp components, uint256 id) internal view returns (string memory) {
    SubtypeComponent comp = SubtypeComponent(getAddrByID(components, SubtypeCompID));
    return comp.has(id) ? comp.get(id) : "";
  }

  function getTree(
    IUintComp components,
    uint256 id
  ) internal view returns (bool, string memory, uint256) {
    SubtypeComponent treeComp = SubtypeComponent(getAddrByID(components, SubtypeCompID));
    if (!treeComp.has(id)) return (false, "", 0);
    return (true, treeComp.get(id), LevelComponent(getAddrByID(components, LevelCompID)).get(id));
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddrByID(components, TypeCompID)).get(id);
  }

  /////////////////
  // QUERIES

  // get registry entry by Skill index
  function getByIndex(IUintComp components, uint32 index) internal view returns (uint256 result) {
    uint256 id = genID(index);
    return IsSkillComponent(getAddrByID(components, IsSkillCompID)).has(id) ? id : 0;
  }

  function getEffectsByIndex(
    IUintComp components,
    uint32 index
  ) internal view returns (uint256[] memory) {
    return
      IDPointerComponent(getAddrByID(components, IDPointerCompID)).getEntitiesWithValue(
        genEffectPtr(index)
      );
  }

  // get requirements by Skill index
  function getRequirementsByIndex(
    IUintComp components,
    uint32 index
  ) internal view returns (uint256[] memory) {
    return
      IDPointerComponent(getAddrByID(components, IDPointerCompID)).getEntitiesWithValue(
        genReqPtr(index)
      );
  }

  ////////////////////
  // UTILS

  function genID(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("registry.skill", index)));
  }

  function genReqPtr(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("registry.skill.requirement", index)));
  }

  function genEffectPtr(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("registry.skill.effect", index)));
  }
}
