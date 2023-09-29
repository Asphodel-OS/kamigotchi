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
import { IsRepeatableComponent, ID as IsRepeatableCompID } from "components/IsRepeatableComponent.sol";
import { IsRequirementComponent, ID as IsRequirementCompID } from "components/IsRequirementComponent.sol";
import { IsRewardComponent, ID as IsRewardCompID } from "components/IsRewardComponent.sol";
import { IsQuestComponent, ID as IsQuestCompID } from "components/IsQuestComponent.sol";
import { DescriptionComponent, ID as DescCompID } from "components/DescriptionComponent.sol";
import { LocationComponent, ID as LocationCompID } from "components/LocationComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { MaxComponent, ID as MaxCompID } from "components/MaxComponent.sol";
import { TimeComponent, ID as TimeCompID } from "components/TimeComponent.sol";
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
    uint256 max,
    string memory name,
    string memory description
  ) internal returns (uint256) {
    uint256 regID = getByQuestIndex(components, index);
    require(regID == 0, "LibRegQ.createQ: index used");

    uint256 id = world.getUniqueEntityId();
    setIsRegistry(components, id);
    setIsQuest(components, id);
    setQuestIndex(components, id, index);
    setMax(components, id, max);
    setName(components, id, name);
    setDescription(components, id, description);

    return id;
  }

  function setRepeatable(IUintComp components, uint256 regID, uint256 duration) internal {
    setIsRepeatable(components, regID);
    setTime(components, regID, duration);
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

  function deleteQuest(IUintComp components, uint256 questID) internal {
    unsetIsRegistry(components, questID);
    unsetIsQuest(components, questID);
    unsetQuestIndex(components, questID);
    unsetName(components, questID);
    unsetMax(components, questID);
    unsetDescription(components, questID);
    unsetLocation(components, questID);

    unsetIsRepeatable(components, questID);
    unsetTime(components, questID);
  }

  function deleteObjective(IUintComp components, uint256 objectiveID) internal {
    unsetIsRegistry(components, objectiveID);
    unsetIsObjective(components, objectiveID);
    unsetQuestIndex(components, objectiveID);
    unsetObjectiveIndex(components, objectiveID);
    unsetName(components, objectiveID);
    unsetLogicType(components, objectiveID);
    unsetType(components, objectiveID);
    unsetIndex(components, objectiveID);
    unsetValue(components, objectiveID);
  }

  function deleteRequirement(IUintComp components, uint256 requirementID) internal {
    unsetIsRegistry(components, requirementID);
    unsetIsRequirement(components, requirementID);
    unsetQuestIndex(components, requirementID);
    unsetLogicType(components, requirementID);
    unsetType(components, requirementID);
    unsetIndex(components, requirementID);
    unsetValue(components, requirementID);
  }

  function deleteReward(IUintComp components, uint256 rewardID) internal {
    unsetIsRegistry(components, rewardID);
    unsetIsReward(components, rewardID);
    unsetQuestIndex(components, rewardID);
    unsetType(components, rewardID);
    unsetIndex(components, rewardID);
    unsetValue(components, rewardID);
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

  function isRepeatable(IUintComp components, uint256 id) internal view returns (bool) {
    return IsRepeatableComponent(getAddressById(components, IsRepeatableCompID)).has(id);
  }

  /////////////////
  // SETTERS

  function setIsRegistry(IUintComp components, uint256 id) internal {
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
  }

  function setIsRepeatable(IUintComp components, uint256 id) internal {
    IsRepeatableComponent(getAddressById(components, IsRepeatableCompID)).set(id);
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

  function setMax(IUintComp components, uint256 id, uint256 max) internal {
    MaxComponent(getAddressById(components, MaxCompID)).set(id, max);
  }

  function setTime(IUintComp components, uint256 id, uint256 time) internal {
    TimeComponent(getAddressById(components, TimeCompID)).set(id, time);
  }

  function setType(IUintComp components, uint256 id, string memory _type) internal {
    TypeComponent(getAddressById(components, TypeCompID)).set(id, _type);
  }

  function setValue(IUintComp components, uint256 id, uint256 value) internal {
    ValueComponent(getAddressById(components, ValueCompID)).set(id, value);
  }

  /////////////////
  // UNSETTERS

  function unsetIsRegistry(IUintComp components, uint256 id) internal {
    if (IsRegistryComponent(getAddressById(components, IsRegCompID)).has(id)) {
      IsRegistryComponent(getAddressById(components, IsRegCompID)).remove(id);
    }
  }

  function unsetIsRepeatable(IUintComp components, uint256 id) internal {
    if (IsRepeatableComponent(getAddressById(components, IsRepeatableCompID)).has(id)) {
      IsRepeatableComponent(getAddressById(components, IsRepeatableCompID)).remove(id);
    }
  }

  function unsetIsQuest(IUintComp components, uint256 id) internal {
    if (IsQuestComponent(getAddressById(components, IsQuestCompID)).has(id)) {
      IsQuestComponent(getAddressById(components, IsQuestCompID)).remove(id);
    }
  }

  function unsetIsObjective(IUintComp components, uint256 id) internal {
    if (IsObjectiveComponent(getAddressById(components, IsObjectiveCompID)).has(id)) {
      IsObjectiveComponent(getAddressById(components, IsObjectiveCompID)).remove(id);
    }
  }

  function unsetIsRequirement(IUintComp components, uint256 id) internal {
    if (IsRequirementComponent(getAddressById(components, IsRequirementCompID)).has(id)) {
      IsRequirementComponent(getAddressById(components, IsRequirementCompID)).remove(id);
    }
  }

  function unsetIsReward(IUintComp components, uint256 id) internal {
    if (IsRewardComponent(getAddressById(components, IsRewardCompID)).has(id)) {
      IsRewardComponent(getAddressById(components, IsRewardCompID)).remove(id);
    }
  }

  function unsetIndex(IUintComp components, uint256 id) internal {
    if (IndexComponent(getAddressById(components, IndexCompID)).has(id)) {
      IndexComponent(getAddressById(components, IndexCompID)).remove(id);
    }
  }

  function unsetObjectiveIndex(IUintComp components, uint256 id) internal {
    if (IndexObjectiveComponent(getAddressById(components, IndexObjectiveCompID)).has(id)) {
      IndexObjectiveComponent(getAddressById(components, IndexObjectiveCompID)).remove(id);
    }
  }

  function unsetQuestIndex(IUintComp components, uint256 id) internal {
    if (IndexQuestComponent(getAddressById(components, IndexQuestCompID)).has(id)) {
      IndexQuestComponent(getAddressById(components, IndexQuestCompID)).remove(id);
    }
  }

  function unsetDescription(IUintComp components, uint256 id) internal {
    if (DescriptionComponent(getAddressById(components, DescCompID)).has(id)) {
      DescriptionComponent(getAddressById(components, DescCompID)).remove(id);
    }
  }

  function unsetLocation(IUintComp components, uint256 id) internal {
    if (LocationComponent(getAddressById(components, LocationCompID)).has(id)) {
      LocationComponent(getAddressById(components, LocationCompID)).remove(id);
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

  function unsetMax(IUintComp components, uint256 id) internal {
    if (MaxComponent(getAddressById(components, MaxCompID)).has(id)) {
      MaxComponent(getAddressById(components, MaxCompID)).remove(id);
    }
  }

  function unsetTime(IUintComp components, uint256 id) internal {
    if (TimeComponent(getAddressById(components, TimeCompID)).has(id)) {
      TimeComponent(getAddressById(components, TimeCompID)).remove(id);
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
