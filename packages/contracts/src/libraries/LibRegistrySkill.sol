// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { DescriptionComponent, ID as DescCompID } from "components/DescriptionComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IndexQuestComponent, ID as IndexQuestCompID } from "components/IndexQuestComponent.sol";
import { IndexSkillComponent, ID as IndexSkillCompID } from "components/IndexSkillComponent.sol";
import { IsEffectComponent, ID as IsEffectCompID } from "components/IsEffectComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { IsRequirementComponent, ID as IsReqCompID } from "components/IsRequirementComponent.sol";
import { IsSkillComponent, ID as IsSkillCompID } from "components/IsSkillComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

// A registry for Skill related entities
// Skills are not copied onto entities, only referenced when assigning the effect

library LibRegistrySkill {
  /////////////////
  // INTERACTIONS

  // Create a registry entry for a Skill
  // Skills have a similar structure to Quests,
  // except its copied permenently onto the entity once completed
  function create(
    IWorld world,
    IUintComp components,
    uint256 skillIndex,
    string memory type_,
    string memory name,
    string memory description
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIsRegistry(components, id);
    setIsSkill(components, id);
    setSkillIndex(components, id, skillIndex);
    setType(components, id, type_);
    setName(components, id, name);
    setDescription(components, id, description);
    return id;
  }

  function createEffect(
    IWorld world,
    IUintComp components,
    uint256 skillIndex,
    string memory type_
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIsRegistry(components, id);
    setIsEffect(components, id);
    setSkillIndex(components, id, skillIndex);
    setType(components, id, type_);
    return id;
  }

  function createRequirement(
    IWorld world,
    IUintComp components,
    uint256 skillIndex,
    string memory type_
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIsRegistry(components, id);
    setIsRequirement(components, id);
    setSkillIndex(components, id, skillIndex);
    setType(components, id, type_);
    return id;
  }

  function delete_(IUintComp components, uint256 id) internal {
    unsetIsRegistry(components, id);
    unsetIsSkill(components, id);
    unsetSkillIndex(components, id);
    unsetType(components, id);
    unsetName(components, id);
    unsetDescription(components, id);
  }

  function deleteEffect(IUintComp components, uint256 id) internal {
    unsetIsRegistry(components, id);
    unsetIsEffect(components, id);
    unsetSkillIndex(components, id);
    unsetType(components, id);
    unsetLogicType(components, id);
    unsetIndex(components, id);
    unsetValue(components, id);
  }

  function deleteRequirement(IUintComp components, uint256 id) internal {
    unsetIsRegistry(components, id);
    unsetIsRequirement(components, id);
    unsetSkillIndex(components, id);
    unsetType(components, id);
    unsetIndex(components, id);
    unsetValue(components, id);
  }

  /////////////////
  // SETTERS

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

  function setIndex(IUintComp components, uint256 id, uint256 index) internal {
    IndexComponent(getAddressById(components, IndexCompID)).set(id, index);
  }

  function setSkillIndex(IUintComp components, uint256 id, uint256 index) internal {
    IndexSkillComponent(getAddressById(components, IndexSkillCompID)).set(id, index);
  }

  function setDescription(IUintComp components, uint256 id, string memory description) internal {
    DescriptionComponent(getAddressById(components, DescCompID)).set(id, description);
  }

  function setLogicType(IUintComp components, uint256 id, string memory logicType) internal {
    LogicTypeComponent(getAddressById(components, LogicTypeCompID)).set(id, logicType);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
  }

  function setType(IUintComp components, uint256 id, string memory _type) internal {
    TypeComponent(getAddressById(components, TypeCompID)).set(id, _type);
  }

  function setValue(IUintComp components, uint256 id, uint256 value) internal {
    ValueComponent(getAddressById(components, ValueCompID)).set(id, value);
  }

  /////////////////
  // UNSETTERS

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

  function unsetDescription(IUintComp components, uint256 id) internal {
    DescriptionComponent(getAddressById(components, DescCompID)).remove(id);
  }

  function unsetLogicType(IUintComp components, uint256 id) internal {
    if (LogicTypeComponent(getAddressById(components, LogicTypeCompID)).has(id)) {
      LogicTypeComponent(getAddressById(components, LogicTypeCompID)).remove(id);
    }
  }

  function unsetName(IUintComp components, uint256 id) internal {
    NameComponent(getAddressById(components, NameCompID)).remove(id);
  }

  function unsetType(IUintComp components, uint256 id) internal {
    if (TypeComponent(getAddressById(components, TypeCompID)).has(id)) {
      TypeComponent(getAddressById(components, TypeCompID)).remove(id);
    }
  }

  function unsetValue(IUintComp components, uint256 id) internal {
    if (ValueComponent(getAddressById(components, ValueCompID)).has(id)) {
      ValueComponent(getAddressById(components, ValueCompID)).remove(id);
    }
  }

  /////////////////
  // QUERIES

  // get registry entry by Skill index
  function getByIndex(IUintComp components, uint256 index) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IsSkillCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexSkillCompID),
      abi.encode(index)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }

  function getEffectsByIndex(
    IUintComp components,
    uint256 index
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IsEffectCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexSkillCompID),
      abi.encode(index)
    );

    return LibQuery.query(fragments);
  }

  // get requirements by Skill index
  function getRequirementsByIndex(
    IUintComp components,
    uint256 index
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IsReqCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexSkillCompID),
      abi.encode(index)
    );

    return LibQuery.query(fragments);
  }
}
