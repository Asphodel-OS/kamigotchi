// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IndexConditionComponent, ID as IndexConditionCompID } from "components/IndexConditionComponent.sol";
import { IndexRewardComponent, ID as IndexRewCompID } from "components/IndexRewardComponent.sol";
import { IndexQuestComponent, ID as IndexQuestCompID } from "components/IndexQuestComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { IsConditionComponent, ID as IsConditionCompID } from "components/IsConditionComponent.sol";
import { IsRewardComponent, ID as IsRewCompID } from "components/IsRewardComponent.sol";
import { IsQuestComponent, ID as IsQuestCompID } from "components/IsQuestComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { QuestObjectivesComponent, ID as QuestObjCompID } from "components/QuestObjectivesComponent.sol";
import { QuestRewardsComponent, ID as QuestRewCompID } from "components/QuestRewardsComponent.sol";
import { QuestRequirementsComponent, ID as QuestReqCompID } from "components/QuestRequirementsComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

import { LibCoin } from "libraries/LibCoin.sol";
import { LibInventory } from "libraries/LibInventory.sol";

// A registry for Quest related entities
// Quest is copied to an Account, the rest are referenced

library LibRegistryQuests {
  /////////////////
  // INTERACTIONS

  // Create a registry entry for a Quest
  function createQuest(
    IWorld world,
    IUintComp components,
    uint256 index,
    string memory name,
    uint256[] memory reqIndex,
    uint256[] memory objIndex,
    uint256[] memory rewIndex
  ) internal returns (uint256) {
    uint256 regID = getByQuestIndex(components, index);
    require(regID == 0, "LibRegQ.createQ: index used");

    uint256 id = world.getUniqueEntityId();
    setIsRegistry(components, id);
    setIsQuest(components, id);
    setQuestIndex(components, id, index);
    setName(components, id, name);

    uint256[] memory requirements = new uint256[](reqIndex.length);
    for (uint256 i; i < reqIndex.length; i++) {
      uint256 reqID = getByConditionIndex(components, reqIndex[i]);
      require(reqID != 0, "LibRegQ.createQ: req not found");
      requirements[i] = reqID;
    }
    setQuestRequirements(components, id, requirements);

    uint256[] memory objectives = new uint256[](objIndex.length);
    for (uint256 i; i < objIndex.length; i++) {
      uint256 objID = getByConditionIndex(components, objIndex[i]);
      require(objID != 0, "LibRegQ.createQ: obj not found");
      objectives[i] = objID;
    }
    setQuestObjectives(components, id, objectives);

    uint256[] memory rewards = new uint256[](rewIndex.length);
    for (uint256 i; i < rewIndex.length; i++) {
      uint256 rewID = getByRewardIndex(components, rewIndex[i]);
      require(rewID != 0, "LibRegQ.createQ: rew not found");
      rewards[i] = rewID;
    }
    setQuestRewards(components, id, rewards);
    return id;
  }

  // Create a registry entry for a Condition (objective/requirement)
  function createEmptyCondition(
    IWorld world,
    IUintComp components,
    uint256 index,
    string memory name,
    string memory logicType
  ) internal returns (uint256) {
    uint256 regID = getByConditionIndex(components, index);
    require(regID == 0, "LibRegQ.createCond: index used");

    uint256 id = world.getUniqueEntityId();
    setIsRegistry(components, id);
    setIsCondition(components, id);
    setConditionIndex(components, id, index);
    setLogicType(components, id, logicType);
    setName(components, id, name);

    return id;
  }

  // Create a registry entry for a Reward
  function createEmptyReward(
    IWorld world,
    IUintComp components,
    uint256 index,
    string memory name,
    string memory logicType
  ) internal returns (uint256) {
    uint256 regID = getByRewardIndex(components, index);
    require(regID == 0, "LibRegQ.createRew: index used");

    uint256 id = world.getUniqueEntityId();
    setIsRegistry(components, id);
    setIsReward(components, id);
    setRewardIndex(components, id, index);
    setName(components, id, name);
    setLogicType(components, id, logicType);

    return id;
  }

  // adds a balance entity/components to either a condition or reward
  function addBalance(
    IWorld world,
    IUintComp components,
    uint256 entityID, // either condition or reward
    uint256 balance,
    uint256 itemIndex, // if any, else 0
    string memory _type
  ) internal returns (uint256) {
    require(!hasType(components, entityID), "LibRegQ.addBal: type alr set");
    setType(components, entityID, _type);

    if (isType(components, entityID, "COIN")) {
      LibCoin._set(components, entityID, balance);
    } else if (isType(components, entityID, "FUNG_INVENTORY")) {
      uint256 invID = LibInventory.create(world, components, entityID, itemIndex);
      LibInventory.inc(components, invID, balance);
    } else {
      revert("LibRegQ.addCondBal: invalid type");
    }
  }

  // Set a registry entry for a Quest
  function setQuest(
    IWorld world,
    IUintComp components,
    uint256 index,
    string memory name,
    uint256[] memory requirements,
    uint256[] memory objectives,
    uint256[] memory rewards
  ) internal returns (uint256) {
    uint256 id = getByQuestIndex(components, index);
    require(id != 0, "LibRegQ.setQ: index not found");

    setName(components, id, name);
    setQuestRequirements(components, id, requirements);
    setQuestObjectives(components, id, objectives);
    setQuestRewards(components, id, rewards);
    return id;
  }

  // Set a registry entry for a Requirement
  function setBaseCondition(
    IWorld world,
    IUintComp components,
    uint256 index,
    uint256 value,
    string memory name,
    string memory _type
  ) internal returns (uint256) {
    uint256 id = getByConditionIndex(components, index);
    require(id != 0, "LibRegQ.setReq: index not found");

    setName(components, id, name);
    setType(components, id, _type);

    return id;
  }

  // Set a registry entry for a Reward
  function setBaseReward(
    IWorld world,
    IUintComp components,
    uint256 index,
    string memory name,
    string memory _type
  ) internal returns (uint256) {
    uint256 id = getByRewardIndex(components, index);
    require(id != 0, "LibRegQ.setRew: index not found");

    setName(components, id, name);
    setType(components, id, _type);

    return id;
  }

  /////////////////
  // CHECKERS

  function hasName(IUintComp components, uint256 id) internal view returns (bool) {
    return NameComponent(getAddressById(components, NameCompID)).has(id);
  }

  function hasType(IUintComp components, uint256 id) internal view returns (bool) {
    return TypeComponent(getAddressById(components, TypeCompID)).has(id);
  }

  function isRegistry(IUintComp components, uint256 id) internal view returns (bool) {
    return IsRegistryComponent(getAddressById(components, IsRegCompID)).has(id);
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

  function setIsCondition(IUintComp components, uint256 id) internal {
    IsConditionComponent(getAddressById(components, IsConditionCompID)).set(id);
  }

  function setIsReward(IUintComp components, uint256 id) internal {
    IsRewardComponent(getAddressById(components, IsRewCompID)).set(id);
  }

  function setQuestIndex(IUintComp components, uint256 id, uint256 questIndex) internal {
    IndexQuestComponent(getAddressById(components, IndexQuestCompID)).set(id, questIndex);
  }

  function setQuestRequirements(
    IUintComp components,
    uint256 id,
    uint256[] memory requirements
  ) internal {
    QuestRequirementsComponent(getAddressById(components, QuestReqCompID)).set(id, requirements);
  }

  function setQuestObjectives(
    IUintComp components,
    uint256 id,
    uint256[] memory objectives
  ) internal {
    QuestObjectivesComponent(getAddressById(components, QuestObjCompID)).set(id, objectives);
  }

  function setQuestRewards(IUintComp components, uint256 id, uint256[] memory rewards) internal {
    QuestRewardsComponent(getAddressById(components, QuestRewCompID)).set(id, rewards);
  }

  function setRewardIndex(IUintComp components, uint256 id, uint256 rewardIndex) internal {
    IndexRewardComponent(getAddressById(components, IndexRewCompID)).set(id, rewardIndex);
  }

  function setConditionIndex(IUintComp components, uint256 id, uint256 index) internal {
    IndexConditionComponent(getAddressById(components, IndexConditionCompID)).set(id, index);
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

  /////////////////
  // GETTERS

  function getQuestIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexQuestComponent(getAddressById(components, IndexQuestCompID)).getValue(id);
  }

  function getConditionIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexConditionComponent(getAddressById(components, IndexConditionCompID)).getValue(id);
  }

  function getRewardIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexRewardComponent(getAddressById(components, IndexRewCompID)).getValue(id);
  }

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddressById(components, NameCompID)).getValue(id);
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).getValue(id);
  }

  /////////////////
  // QUERIES

  // get registry entry by Quest index
  function getByQuestIndex(
    IUintComp components,
    uint256 index
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexQuestCompID),
      abi.encode(index)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }

  // get registry entry by condition index
  function getByConditionIndex(
    IUintComp components,
    uint256 conditionIndex
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexConditionCompID),
      abi.encode(conditionIndex)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }

  // get registry entry by Reward index
  function getByRewardIndex(
    IUintComp components,
    uint256 rewardIndex
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexRewCompID),
      abi.encode(rewardIndex)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }
}
