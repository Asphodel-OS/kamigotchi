// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IComponent as IComp } from "solecs/interfaces/IComponent.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IdAccountComponent, ID as IdAccountCompID } from "components/IdAccountComponent.sol";
import { IsConditionComponent, ID as IsConditionCompID } from "components/IsConditionComponent.sol";
import { IsRewardComponent, ID as IsRewardCompID } from "components/IsRewardComponent.sol";
import { IsQuestComponent, ID as IsQuestCompID } from "components/IsQuestComponent.sol";
import { QuestCompletionComponent, ID as CompletionCompID } from "components/QuestCompletionComponent.sol";
import { QuestObjectivesComponent, ID as ObjectivesCompID } from "components/QuestObjectivesComponent.sol";
import { QuestRewardsComponent, ID as RewardsCompID } from "components/QuestRewardsComponent.sol";
import { QuestRequirementsComponent, ID as RequirementsCompID } from "components/QuestRequirementsComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

import { LibCoin } from "libraries/LibCoin.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibRegistryQuests } from "libraries/LibRegistryQuests.sol";

/*
 * LibQuests handles quests!
 *
 * Quest have arrays of Requirements, Objectives, and Rewards
 * Only Quest is copied to an Account, the rest are referenced to a registry
 */
library LibQuests {
  /////////////////
  // INTERACTIONS
  // copies a registry quest and assigns it to an account
  function assignQuest(
    IWorld world,
    IUintComp components,
    uint256 questID,
    uint256 accountID
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();

    setAccountId(components, id, accountID);

    uint256[] memory componentIDs = getQuestCompSet(components, questID);
    for (uint256 i = 0; i < componentIDs.length; i++) {
      bytes memory val = IComp(getAddressById(components, componentIDs[i])).getRawValue(questID);
      IComp(getAddressById(components, componentIDs[i])).set(id, val);
    }
  }

  function completeQuest(IWorld world, IUintComp components, uint256 questID) internal {
    require(!isCompleted(components, questID), "Quests: alr completed");
    setCompleted(components, questID);

    distributeRewards(world, components, questID);
  }

  function checkRequirements(
    IUintComp components,
    uint256 questID,
    uint256 accountID
  ) internal view returns (bool result) {
    uint256[] memory requirements = getRequirements(components, questID);

    if (requirements.length == 0) {
      return true;
    }

    return checkConditions(components, accountID, requirements);
  }

  function checkObjectives(
    IUintComp components,
    uint256 questID
  ) internal view returns (bool result) {
    uint256[] memory objectives = getObjectives(components, questID);
    uint256 accountID = getAccountId(components, questID);

    if (objectives.length == 0) {
      return true;
    }

    return checkConditions(components, accountID, objectives);
  }

  /////////////////
  // CONDITIONS CHECK

  // checks if conditions are fufilled, AND logic
  function checkConditions(
    IUintComp components,
    uint256 accountID,
    uint256[] memory conditions
  ) internal view returns (bool result) {
    for (uint256 i = 0; i < conditions.length; i++) {
      string memory logicType = getLogicType(components, conditions[i]);
      if (isLogicType(components, conditions[i], "CURR_MIN")) {
        result = checkCurrMin(components, conditions[i], accountID);
      } else {
        require(false, "Unknown condition logic type");
      }

      // break if false
      if (!result) {
        break;
      }
    }
    return result;
  }

  function checkCurrMin(
    IUintComp components,
    uint256 conditionID,
    uint256 accountID
  ) internal view returns (bool) {
    // details of condition
    string memory _type = getType(components, conditionID);
    uint256 itemIndex;
    if (isType(components, conditionID, "FUNG_INVENTORY")) {
      // conditions only can hold 1 inventory type
      uint256 invID = LibInventory.getAllForHolder(components, conditionID)[0];
      itemIndex = LibInventory.getItemIndex(components, invID);
    }
    uint256 minBal = getBalanceOf(components, conditionID, itemIndex, _type);

    // check account
    uint256 accountValue = getBalanceOf(components, accountID, itemIndex, _type);

    return accountValue >= minBal;
  }

  /////////////////
  // REWARDS DISTRIBUTION

  function distributeRewards(IWorld world, IUintComp components, uint256 questID) internal {
    uint256[] memory rewards = getRewards(components, questID);
    uint256 accountID = getAccountId(components, questID);

    for (uint256 i = 0; i < rewards.length; i++) {
      string memory logicType = getType(components, rewards[i]);
      if (isLogicType(components, rewards[i], "INC")) {
        incBalOf(world, components, accountID, rewards[i]);
      } else {
        require(false, "Unknown reward logic type");
      }
    }
  }

  function incBalOf(
    IWorld world,
    IUintComp components,
    uint256 accountID,
    uint256 rewardID
  ) internal {
    string memory _type = getType(components, rewardID);
    uint256 itemIndex;
    if (isType(components, rewardID, "FUNG_INVENTORY")) {
      // conditions only can hold 1 inventory type
      uint256 invID = LibInventory.getAllForHolder(components, rewardID)[0];
      itemIndex = LibInventory.getItemIndex(components, invID);
    }

    uint256 amount = getBalanceOf(components, rewardID, itemIndex, _type);

    if (isType(components, rewardID, "COIN")) {
      LibCoin.inc(components, accountID, amount);
    } else if (isType(components, rewardID, "FUNG_INVENTORY")) {
      uint256 invID = LibInventory.get(components, accountID, itemIndex);
      if (invID == 0) {
        invID = LibInventory.create(world, components, accountID, itemIndex);
      }
      LibInventory.inc(components, invID, amount);
    } else {
      require(false, "Unknown reward type");
    }
  }

  /////////////////
  // CHECKERS

  function isQuest(IUintComp components, uint256 id) internal view returns (bool) {
    return IsQuestComponent(getAddressById(components, IsQuestCompID)).has(id);
  }

  function isCondition(IUintComp components, uint256 id) internal view returns (bool) {
    return IsConditionComponent(getAddressById(components, IsConditionCompID)).has(id);
  }

  function isReward(IUintComp components, uint256 id) internal view returns (bool) {
    return IsRewardComponent(getAddressById(components, IsRewardCompID)).has(id);
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

  function isCompleted(IUintComp components, uint256 id) internal view returns (bool) {
    return QuestCompletionComponent(getAddressById(components, CompletionCompID)).has(id);
  }

  function hasName(IUintComp components, uint256 id) internal view returns (bool) {
    return NameComponent(getAddressById(components, NameCompID)).has(id);
  }

  function hasQuestRequirements(IUintComp components, uint256 id) internal view returns (bool) {
    return QuestRequirementsComponent(getAddressById(components, RequirementsCompID)).has(id);
  }

  function hasQuestObjectives(IUintComp components, uint256 id) internal view returns (bool) {
    return QuestObjectivesComponent(getAddressById(components, ObjectivesCompID)).has(id);
  }

  function hasQuestRewards(IUintComp components, uint256 id) internal view returns (bool) {
    return QuestRewardsComponent(getAddressById(components, RewardsCompID)).has(id);
  }

  /////////////////
  // SETTERS

  function setAccountId(IUintComp components, uint256 id, uint256 accountID) internal {
    IdAccountComponent(getAddressById(components, IdAccountCompID)).set(id, accountID);
  }

  function setCompleted(IUintComp components, uint256 id) internal {
    QuestCompletionComponent(getAddressById(components, CompletionCompID)).set(id);
  }

  /////////////////
  // GETTERS

  function getAccountId(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdAccountComponent(getAddressById(components, IdAccountCompID)).getValue(id);
  }

  function getLogicType(IUintComp components, uint256 id) internal view returns (string memory) {
    return LogicTypeComponent(getAddressById(components, LogicTypeCompID)).getValue(id);
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).getValue(id);
  }

  function getRequirements(
    IUintComp components,
    uint256 id
  ) internal view returns (uint256[] memory) {
    return QuestRequirementsComponent(getAddressById(components, RequirementsCompID)).getValue(id);
  }

  function getObjectives(
    IUintComp components,
    uint256 id
  ) internal view returns (uint256[] memory) {
    return QuestObjectivesComponent(getAddressById(components, ObjectivesCompID)).getValue(id);
  }

  function getRewards(IUintComp components, uint256 id) internal view returns (uint256[] memory) {
    return QuestRewardsComponent(getAddressById(components, RewardsCompID)).getValue(id);
  }

  function getBalanceOf(
    IUintComp components,
    uint256 id,
    uint256 itemIndex,
    string memory _type
  ) internal view returns (uint256) {
    if (keccak256(abi.encode(_type)) == keccak256(abi.encode("COIN"))) {
      return LibCoin.get(components, id);
    } else if (keccak256(abi.encode(_type)) == keccak256(abi.encode("FUNG_INVENTORY"))) {
      uint256 invID = LibInventory.get(components, id, itemIndex);
      if (invID == 0) return 0;
      else return LibInventory.getBalance(components, invID);
    } else {
      require(false, "Unknown type");
    }
  }

  /////////////////
  // CALCULATIONS

  // Get all the component IDs of a quest's components
  function getQuestCompSet(
    IUintComp components,
    uint256 id
  ) internal view returns (uint256[] memory) {
    uint256 statCount = 1;
    if (hasName(components, id)) statCount++;
    if (hasQuestObjectives(components, id)) statCount++;
    if (hasQuestRequirements(components, id)) statCount++;
    if (hasQuestRewards(components, id)) statCount++;

    uint256 i;
    uint256[] memory statComponents = new uint256[](statCount);
    statComponents[i++] = IsQuestCompID;
    if (hasName(components, id)) statComponents[i++] = NameCompID;
    if (hasQuestObjectives(components, id)) statComponents[i++] = ObjectivesCompID;
    if (hasQuestRequirements(components, id)) statComponents[i++] = RequirementsCompID;
    if (hasQuestRewards(components, id)) statComponents[i++] = RewardsCompID;
    return statComponents;
  }
}
