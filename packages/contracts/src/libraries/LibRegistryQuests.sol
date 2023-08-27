// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IndexObjectiveComponent, ID as IndexObjectiveCompID } from "components/IndexObjectiveComponent.sol";
import { IndexQuestComponent, ID as IndexQuestCompID } from "components/IndexQuestComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { IsObjectiveComponent, ID as IsObjectiveCompID } from "components/IsObjectiveComponent.sol";
import { IsRequirementComponent, ID as IsRequirementCompID } from "components/IsRequirementComponent.sol";
import { IsRewardComponent, ID as IsRewardCompID } from "components/IsRewardComponent.sol";
import { IsQuestComponent, ID as IsQuestCompID } from "components/IsQuestComponent.sol";
import { DescriptionComponent, ID as DescCompID } from "components/DescriptionComponent.sol";
import { LocationComponent, ID as LocationCompID } from "components/LocationComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibCoin } from "libraries/LibCoin.sol";
import { LibInventory } from "libraries/LibInventory.sol";

// A registry for Quest related entities
// Quest is copied to an Account, the rest are referenced

library LibRegistryQuests {
  /////////////////
  // INTERACTIONS

  // Create a registry entry for a Quest
  // requires that all requirements, objectives and rewards are already registered
  function createQuest(
    IWorld world,
    IUintComp components,
    uint256 index,
    string memory name,
    string memory description
  ) internal returns (uint256) {
    uint256 regID = getByQuestIndex(components, index);
    require(regID == 0, "LibRegQ.createQ: index used");

    uint256 id = world.getUniqueEntityId();
    setIsRegistry(components, id);
    setIsQuest(components, id);
    setQuestIndex(components, id, index);
    setName(components, id, name);
    setDescription(components, id, description);

    return id;
  }

  function createEmptyObjective(
    IWorld world,
    IUintComp components,
    uint256 questIndex,
    string memory name, // this is a crutch to help FE, ideally we drop this
    string memory logicType,
    string memory type_
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIsRegistry(components, id);
    setIsObjective(components, id);
    setQuestIndex(components, id, questIndex);
    setName(components, id, name);
    setLogicType(components, id, logicType);
    setType(components, id, type_);

    uint256 numObjectives = getObjectivesByQuestIndex(components, questIndex).length;
    setObjectiveIndex(components, id, numObjectives + 1);
    return id;
  }

  function createEmptyRequirement(
    IWorld world,
    IUintComp components,
    uint256 questIndex,
    string memory logicType,
    string memory type_
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIsRegistry(components, id);
    setIsRequirement(components, id);
    setQuestIndex(components, id, questIndex);
    setLogicType(components, id, logicType);
    setType(components, id, type_);
    return id;
  }

  function createEmptyReward(
    IWorld world,
    IUintComp components,
    uint256 questIndex,
    string memory type_
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIsRegistry(components, id);
    setIsReward(components, id);
    setQuestIndex(components, id, questIndex);
    setType(components, id, type_);
    return id;
  }

  /////////////////
  // CHECKERS

  function hasType(IUintComp components, uint256 id) internal view returns (bool) {
    return TypeComponent(getAddressById(components, TypeCompID)).has(id);
  }

  function isType(
    IUintComp components,
    uint256 id,
    string memory _type
  ) internal view returns (bool) {
    return TypeComponent(getAddressById(components, TypeCompID)).hasValue(id, _type);
  }

  function isLogicType(
    IUintComp components,
    uint256 id,
    string memory _type
  ) internal view returns (bool) {
    return LogicTypeComponent(getAddressById(components, LogicTypeCompID)).hasValue(id, _type);
  }

  /////////////////
  // SETTERS

  function setIsRegistry(IUintComp components, uint256 id) internal {
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
  }

  function setIsQuest(IUintComp components, uint256 id) internal {
    IsQuestComponent(getAddressById(components, IsQuestCompID)).set(id);
  }

  function setIsObjective(IUintComp components, uint256 id) internal {
    IsObjectiveComponent(getAddressById(components, IsObjectiveCompID)).set(id);
  }

  function setIsRequirement(IUintComp components, uint256 id) internal {
    IsRequirementComponent(getAddressById(components, IsRequirementCompID)).set(id);
  }

  function setIsReward(IUintComp components, uint256 id) internal {
    IsRewardComponent(getAddressById(components, IsRewardCompID)).set(id);
  }

  function setIndex(IUintComp components, uint256 id, uint256 index) internal {
    IndexComponent(getAddressById(components, IndexCompID)).set(id, index);
  }

  function setObjectiveIndex(IUintComp components, uint256 id, uint256 index) internal {
    IndexObjectiveComponent(getAddressById(components, IndexObjectiveCompID)).set(id, index);
  }

  function setQuestIndex(IUintComp components, uint256 id, uint256 questIndex) internal {
    IndexQuestComponent(getAddressById(components, IndexQuestCompID)).set(id, questIndex);
  }

  function setDescription(IUintComp components, uint256 id, string memory description) internal {
    DescriptionComponent(getAddressById(components, DescCompID)).set(id, description);
  }

  function setLocation(IUintComp components, uint256 id, uint256 location) internal {
    LocationComponent(getAddressById(components, LocationCompID)).set(id, location);
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
  // QUERIES

  // get registry entry by Quest index
  function getByQuestIndex(
    IUintComp components,
    uint256 index
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IsQuestCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexQuestCompID),
      abi.encode(index)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }

  // get Objectives by Quest index
  function getObjectivesByQuestIndex(
    IUintComp components,
    uint256 index
  ) internal view returns (uint256[] memory results) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(
      QueryType.Has,
      getComponentById(components, IsObjectiveCompID),
      ""
    );
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexQuestCompID),
      abi.encode(index)
    );

    results = LibQuery.query(fragments);
  }

  // get requirements by Quest index
  function getRequirementsByQuestIndex(
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
      getComponentById(components, IndexQuestCompID),
      abi.encode(index)
    );

    results = LibQuery.query(fragments);
  }

  // get reward by Quest index
  function getRewardsByQuestIndex(
    IUintComp components,
    uint256 index
  ) internal view returns (uint256[] memory results) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IsRewardCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexQuestCompID),
      abi.encode(index)
    );

    results = LibQuery.query(fragments);
  }
}
