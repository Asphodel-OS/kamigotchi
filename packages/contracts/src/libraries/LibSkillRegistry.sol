// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IndexQuestComponent, ID as IndexQuestCompID } from "components/IndexQuestComponent.sol";
import { IndexSkillComponent, ID as IndexSkillCompID } from "components/IndexSkillComponent.sol";
import { IDPointerComponent, ID as IDPointerCompID } from "components/IDPointerComponent.sol";
import { IsEffectComponent, ID as IsEffectCompID } from "components/IsEffectComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { IsRequirementComponent, ID as IsReqCompID } from "components/IsRequirementComponent.sol";
import { IsSkillComponent, ID as IsSkillCompID } from "components/IsSkillComponent.sol";

import { ValueSignedComponent, ID as ValueSignedCompID } from "components/ValueSignedComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { CostComponent, ID as CostCompID } from "components/CostComponent.sol";
import { DescriptionComponent, ID as DescCompID } from "components/DescriptionComponent.sol";
import { ForComponent, ID as ForCompID } from "components/ForComponent.sol";
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
    setIsSkill(components, id);
    setSkillIndex(components, id, skillIndex);
    setType(components, id, type_);
    setName(components, id, name);
    setCost(components, id, cost);
    setMax(components, id, max);
    setMediaURI(components, id, media);
    DescriptionComponent(getAddressById(components, DescCompID)).set(id, description);

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
    ValueSignedComponent(getAddressById(components, ValueSignedCompID)).set(id, value);
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
    setIsRequirement(components, id);
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
    DescriptionComponent(getAddressById(components, DescCompID)).remove(id);
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
    unsetIsRequirement(components, id);
    unsetSkillIndex(components, id);
    unsetType(components, id);
    unsetIndex(components, id);
    unsetBalance(components, id);
    unsetConditionOwner(components, id);
  }

  /////////////////
  // SETTERS

  function setConditionOwner(IUintComp components, uint256 id, uint256 ownerID) internal {
    IDPointerComponent(getAddressById(components, IDPointerCompID)).set(id, ownerID);
  }

  function setIsEffect(IUintComp components, uint256 id) internal {
    IsEffectComponent(getAddressById(components, IsEffectCompID)).set(id);
  }

  function setIsRegistry(IUintComp components, uint256 id) internal {
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
  }

  function setIsRequirement(IUintComp components, uint256 id) internal {
    IsRequirementComponent(getAddressById(components, IsReqCompID)).set(id);
  }

  function setIsSkill(IUintComp components, uint256 id) internal {
    IsSkillComponent(getAddressById(components, IsSkillCompID)).set(id);
  }

  function setIndex(IUintComp components, uint256 id, uint32 index) internal {
    IndexComponent(getAddressById(components, IndexCompID)).set(id, index);
  }

  function setSkillIndex(IUintComp components, uint256 id, uint32 index) internal {
    IndexSkillComponent(getAddressById(components, IndexSkillCompID)).set(id, index);
  }

  function setCost(IUintComp components, uint256 id, uint256 cost) internal {
    CostComponent(getAddressById(components, CostCompID)).set(id, cost);
  }

  function setFor(IUintComp components, uint256 id, uint for_) internal {
    ForComponent(getAddressById(components, ForCompID)).set(id, for_);
  }

  function setLogicType(IUintComp components, uint256 id, string memory logicType) internal {
    LogicTypeComponent(getAddressById(components, LogicTypeCompID)).set(id, logicType);
  }

  function setMax(IUintComp components, uint256 id, uint256 max) internal {
    MaxComponent(getAddressById(components, MaxCompID)).set(id, max);
  }

  function setMediaURI(IUintComp components, uint256 id, string memory mediaURI) internal {
    MediaURIComponent(getAddressById(components, MediaURICompID)).set(id, mediaURI);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
  }

  /// @notice set the skill tree for a skill (optional)
  /// @dev uses the subtype component
  function setTree(IUintComp components, uint256 id, string memory tree, uint256 level) internal {
    setSubtype(components, id, tree);
    LevelComponent(getAddressById(components, LevelCompID)).set(id, level);
  }

  function setSubtype(IUintComp components, uint256 id, string memory subtype) internal {
    SubtypeComponent(getAddressById(components, SubtypeCompID)).set(id, subtype);
  }

  function setType(IUintComp components, uint256 id, string memory _type) internal {
    TypeComponent(getAddressById(components, TypeCompID)).set(id, _type);
  }

  function setBalance(IUintComp components, uint256 id, uint256 value) internal {
    ValueComponent(getAddressById(components, ValueCompID)).set(id, value);
  }

  /////////////////
  // UNSETTERS

  function unsetConditionOwner(IUintComp components, uint256 id) internal {
    IDPointerComponent(getAddressById(components, IDPointerCompID)).remove(id);
  }

  function unsetIsEffect(IUintComp components, uint256 id) internal {
    IsEffectComponent(getAddressById(components, IsEffectCompID)).remove(id);
  }

  function unsetIsRegistry(IUintComp components, uint256 id) internal {
    IsRegistryComponent(getAddressById(components, IsRegCompID)).remove(id);
  }

  function unsetIsRequirement(IUintComp components, uint256 id) internal {
    IsRequirementComponent(getAddressById(components, IsReqCompID)).remove(id);
  }

  function unsetIsSkill(IUintComp components, uint256 id) internal {
    IsSkillComponent(getAddressById(components, IsSkillCompID)).remove(id);
  }

  function unsetIndex(IUintComp components, uint256 id) internal {
    if (IndexComponent(getAddressById(components, IndexCompID)).has(id)) {
      IndexComponent(getAddressById(components, IndexCompID)).remove(id);
    }
  }

  function unsetSkillIndex(IUintComp components, uint256 id) internal {
    IndexSkillComponent(getAddressById(components, IndexSkillCompID)).remove(id);
  }

  function unsetCost(IUintComp components, uint256 id) internal {
    CostComponent(getAddressById(components, CostCompID)).remove(id);
  }

  function unsetFor(IUintComp components, uint256 id) internal {
    ForComponent(getAddressById(components, ForCompID)).remove(id);
  }

  function unsetLogicType(IUintComp components, uint256 id) internal {
    if (LogicTypeComponent(getAddressById(components, LogicTypeCompID)).has(id)) {
      LogicTypeComponent(getAddressById(components, LogicTypeCompID)).remove(id);
    }
  }

  function unsetMax(IUintComp components, uint256 id) internal {
    MaxComponent(getAddressById(components, MaxCompID)).remove(id);
  }

  function unsetMediaURI(IUintComp components, uint256 id) internal {
    if (MediaURIComponent(getAddressById(components, MediaURICompID)).has(id)) {
      MediaURIComponent(getAddressById(components, MediaURICompID)).remove(id);
    }
  }

  function unsetName(IUintComp components, uint256 id) internal {
    NameComponent(getAddressById(components, NameCompID)).remove(id);
  }

  function unsetSubtype(IUintComp components, uint256 id) internal {
    if (SubtypeComponent(getAddressById(components, SubtypeCompID)).has(id)) {
      SubtypeComponent(getAddressById(components, SubtypeCompID)).remove(id);
    }
  }

  function unsetTree(IUintComp components, uint256 id) internal {
    unsetSubtype(components, id);
    LevelComponent levelComp = LevelComponent(getAddressById(components, LevelCompID));
    if (levelComp.has(id)) levelComp.remove(id);
  }

  function unsetType(IUintComp components, uint256 id) internal {
    if (TypeComponent(getAddressById(components, TypeCompID)).has(id)) {
      TypeComponent(getAddressById(components, TypeCompID)).remove(id);
    }
  }

  function unsetBalance(IUintComp components, uint256 id) internal {
    if (ValueComponent(getAddressById(components, ValueCompID)).has(id)) {
      ValueComponent(getAddressById(components, ValueCompID)).remove(id);
    }
  }

  function unsetBalanceSigned(IUintComp components, uint256 id) internal {
    if (ValueSignedComponent(getAddressById(components, ValueSignedCompID)).has(id)) {
      ValueSignedComponent(getAddressById(components, ValueSignedCompID)).remove(id);
    }
  }

  /////////////////
  // GETTERS

  function getBalance(IUintComp components, uint256 id) internal view returns (uint256) {
    return ValueComponent(getAddressById(components, ValueCompID)).get(id);
  }

  function getBalanceSigned(IUintComp components, uint256 id) internal view returns (int256) {
    return ValueSignedComponent(getAddressById(components, ValueSignedCompID)).get(id);
  }

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexComponent(getAddressById(components, IndexCompID)).get(id);
  }

  function getSkillIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexSkillComponent(getAddressById(components, IndexSkillCompID)).get(id);
  }

  function getCost(IUintComp components, uint256 id) internal view returns (uint256) {
    return CostComponent(getAddressById(components, CostCompID)).get(id);
  }

  function getLogicType(IUintComp components, uint256 id) internal view returns (string memory) {
    return LogicTypeComponent(getAddressById(components, LogicTypeCompID)).get(id);
  }

  function getMax(IUintComp components, uint256 id) internal view returns (uint256) {
    return MaxComponent(getAddressById(components, MaxCompID)).get(id);
  }

  function getSubtype(IUintComp components, uint256 id) internal view returns (string memory) {
    SubtypeComponent comp = SubtypeComponent(getAddressById(components, SubtypeCompID));
    return comp.has(id) ? comp.get(id) : "";
  }

  function getTree(
    IUintComp components,
    uint256 id
  ) internal view returns (bool, string memory, uint256) {
    SubtypeComponent treeComp = SubtypeComponent(getAddressById(components, SubtypeCompID));
    if (!treeComp.has(id)) return (false, "", 0);
    return (
      true,
      treeComp.get(id),
      LevelComponent(getAddressById(components, LevelCompID)).get(id)
    );
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).get(id);
  }

  /////////////////
  // QUERIES

  // get registry entry by Skill index
  function getByIndex(IUintComp components, uint32 index) internal view returns (uint256 result) {
    uint256 id = genID(index);
    return IsSkillComponent(getAddressById(components, IsSkillCompID)).has(id) ? id : 0;
  }

  function getEffectsByIndex(
    IUintComp components,
    uint32 index
  ) internal view returns (uint256[] memory) {
    return
      IDPointerComponent(getAddressById(components, IDPointerCompID)).getEntitiesWithValue(
        genEffectPtr(index)
      );
  }

  // get requirements by Skill index
  function getRequirementsByIndex(
    IUintComp components,
    uint32 index
  ) internal view returns (uint256[] memory) {
    return
      IDPointerComponent(getAddressById(components, IDPointerCompID)).getEntitiesWithValue(
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
