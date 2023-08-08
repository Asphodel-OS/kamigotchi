// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IndexConditionComponent, ID as IndexConditionCompID } from "components/IndexConditionComponent.sol";
import { IndexQuestComponent, ID as IndexQuestCompID } from "components/IndexQuestComponent.sol";
import { IsConditionComponent, ID as IsConditionCompID } from "components/IsConditionComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { IsObjectiveComponent, ID as IsObjectiveCompID } from "components/IsObjectiveComponent.sol";
import { IsRequirementComponent, ID as IsRequirementCompID } from "components/IsRequirementComponent.sol";
import { IsRewardComponent, ID as IsRewardCompID } from "components/IsRewardComponent.sol";
import { IsQuestComponent, ID as IsQuestCompID } from "components/IsQuestComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
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
  // requires that all requirements, objectives and rewards are already registered
  function createQuest(
    IWorld world,
    IUintComp components,
    uint256 index,
    string memory name
  ) internal returns (uint256) {
    uint256 regID = getByQuestIndex(components, index);
    require(regID == 0, "LibRegQ.createQ: index used");

    uint256 id = world.getUniqueEntityId();
    setIsRegistry(components, id);
    setIsQuest(components, id);
    setQuestIndex(components, id, index);
    setName(components, id, name);

    return id;
  }

  // Create a registry entry for a Condition (objective/requirement/reward)
  function createEmptyCondition(
    IWorld world,
    IUintComp components,
    uint256 questIndex,
    string memory name,
    string memory logicType
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();

    uint256 index = getConditionCount(components) + 1;
    setConditionIndex(components, id, index);
    setIsRegistry(components, id);
    setIsCondition(components, id);
    setQuestIndex(components, id, questIndex);
    setLogicType(components, id, logicType);
    setName(components, id, name);

    return id;
  }

  function declareObjective(IUintComp components, uint256 id) internal {
    setIsObjective(components, id);
  }

  function declareRequirement(IUintComp components, uint256 id) internal {
    setIsRequirement(components, id);
  }

  function declareReward(IUintComp components, uint256 id) internal {
    setIsReward(components, id);
  }

  // adds a balance entity/components to a condition
  function addBalance(
    IWorld world,
    IUintComp components,
    uint256 entityID, // condition id
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

  function setIsCondition(IUintComp components, uint256 id) internal {
    IsConditionComponent(getAddressById(components, IsConditionCompID)).set(id);
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

  function setQuestIndex(IUintComp components, uint256 id, uint256 questIndex) internal {
    IndexQuestComponent(getAddressById(components, IndexQuestCompID)).set(id, questIndex);
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

  function getConditionCount(IUintComp components) internal view returns (uint256) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[0] = QueryFragment(
      QueryType.Has,
      getComponentById(components, IsConditionCompID),
      ""
    );
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
