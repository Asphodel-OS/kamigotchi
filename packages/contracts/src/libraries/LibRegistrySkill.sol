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
import { IsDescriptionComponent, ID as IsDescriptionCompID } from "components/IsDescriptionComponent.sol";
import { IsSkillComponent, ID as IsSkillCompID } from "components/IsSkillComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { IsRequirementComponent, ID as IsRequirementCompID } from "components/IsRequirementComponent.sol";
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
  function createSkill(
    IWorld world,
    IUintComp components,
    uint256 skillIndex,
    string memory type_
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIsRegistry(components, id);
    setIsSkill(components, id);
    setSkillIndex(components, id, skillIndex);
    setType(components, id, type_);
    return id;
  }

  // Creates a description for a Skill
  function createSkillDescription(
    IWorld world,
    IUintComp components,
    uint256 index,
    string memory name,
    string memory description
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIsRegistry(components, id);
    setIsDescription(components, id);
    setSkillIndex(components, id, index);
    setName(components, id, name);
    setDescription(components, id, description);

    return id;
  }

  function createEmptyRequirement(
    IWorld world,
    IUintComp components,
    uint256 skillIndex,
    string memory logicType,
    string memory type_
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIsRegistry(components, id);
    setIsRequirement(components, id);
    setSkillIndex(components, id, skillIndex);
    setLogicType(components, id, logicType);
    setType(components, id, type_);
    return id;
  }

  function deleteSkill(IUintComp components, uint256 id) internal {
    unsetIsRegistry(components, id);
    unsetIsSkill(components, id);
    unsetSkillIndex(components, id);
    unsetType(components, id);
  }

  function deleteSkillDescription(IUintComp components, uint256 id) internal {
    unsetIsRegistry(components, id);
    unsetIsDescription(components, id);
    unsetSkillIndex(components, id);
    unsetName(components, id);
    unsetDescription(components, id);
  }

  function deleteRequirement(IUintComp components, uint256 id) internal {
    unsetIsRegistry(components, id);
    unsetIsRequirement(components, id);
    unsetSkillIndex(components, id);
    unsetLogicType(components, id);
    unsetType(components, id);
    unsetIndex(components, id);
    unsetValue(components, id);
  }

  /////////////////
  // SETTERS

  function setIsRegistry(IUintComp components, uint256 id) internal {
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
  }

  function setIsDescription(IUintComp components, uint256 id) internal {
    IsDescriptionComponent(getAddressById(components, IsRegCompID)).set(id);
  }

  function setIsSkill(IUintComp components, uint256 id) internal {
    IsSkillComponent(getAddressById(components, IsSkillCompID)).set(id);
  }

  function setIsRequirement(IUintComp components, uint256 id) internal {
    IsRequirementComponent(getAddressById(components, IsRequirementCompID)).set(id);
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

  function unsetIsDescription(IUintComp components, uint256 id) internal {
    if (IsDescriptionComponent(getAddressById(components, IsRegCompID)).has(id)) {
      IsDescriptionComponent(getAddressById(components, IsRegCompID)).remove(id);
    }
  }

  function unsetIsRegistry(IUintComp components, uint256 id) internal {
    if (IsRegistryComponent(getAddressById(components, IsRegCompID)).has(id)) {
      IsRegistryComponent(getAddressById(components, IsRegCompID)).remove(id);
    }
  }

  function unsetIsSkill(IUintComp components, uint256 id) internal {
    if (IsSkillComponent(getAddressById(components, IsSkillCompID)).has(id)) {
      IsSkillComponent(getAddressById(components, IsSkillCompID)).remove(id);
    }
  }

  function unsetIsRequirement(IUintComp components, uint256 id) internal {
    if (IsRequirementComponent(getAddressById(components, IsRequirementCompID)).has(id)) {
      IsRequirementComponent(getAddressById(components, IsRequirementCompID)).remove(id);
    }
  }

  function unsetIndex(IUintComp components, uint256 id) internal {
    if (IndexComponent(getAddressById(components, IndexCompID)).has(id)) {
      IndexComponent(getAddressById(components, IndexCompID)).remove(id);
    }
  }

  function unsetSkillIndex(IUintComp components, uint256 id) internal {
    if (IndexSkillComponent(getAddressById(components, IndexSkillCompID)).has(id)) {
      IndexSkillComponent(getAddressById(components, IndexSkillCompID)).remove(id);
    }
  }

  function unsetDescription(IUintComp components, uint256 id) internal {
    if (DescriptionComponent(getAddressById(components, DescCompID)).has(id)) {
      DescriptionComponent(getAddressById(components, DescCompID)).remove(id);
    }
  }

  function unsetLogicType(IUintComp components, uint256 id) internal {
    if (LogicTypeComponent(getAddressById(components, LogicTypeCompID)).has(id)) {
      LogicTypeComponent(getAddressById(components, LogicTypeCompID)).remove(id);
    }
  }

  function unsetName(IUintComp components, uint256 id) internal {
    if (NameComponent(getAddressById(components, NameCompID)).has(id)) {
      NameComponent(getAddressById(components, NameCompID)).remove(id);
    }
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
  function getSkillsByIndex(
    IUintComp components,
    uint256 index
  ) internal view returns (uint256[] memory results) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IsSkillCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexSkillCompID),
      abi.encode(index)
    );

    results = LibQuery.query(fragments);
  }

  // get requirements by Skill index
  function getRequirementsByIndex(
    IUintComp components,
    uint256 index
  ) internal view returns (uint256[] memory results) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(
      QueryType.Has,
      getComponentById(components, IsRequirementCompID),
      ""
    );
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexSkillCompID),
      abi.encode(index)
    );

    results = LibQuery.query(fragments);
  }

  function getDescriptionByIndex(
    IUintComp components,
    uint256 index
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(
      QueryType.Has,
      getComponentById(components, IsDescriptionCompID),
      ""
    );
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexSkillCompID),
      abi.encode(index)
    );

    uint256[] memory results = LibQuery.query(fragments);

    if (results.length == 0) return 0;
    return results[0];
  }
}
