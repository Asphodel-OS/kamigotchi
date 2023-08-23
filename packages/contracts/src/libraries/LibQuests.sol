// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IComponent as IComp } from "solecs/interfaces/IComponent.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IdAccountComponent, ID as IdAccountCompID } from "components/IdAccountComponent.sol";
import { IsRewardComponent, ID as IsRewardCompID } from "components/IsRewardComponent.sol";
import { IsQuestComponent, ID as IsQuestCompID } from "components/IsQuestComponent.sol";
import { IsCompleteComponent, ID as CompletionCompID } from "components/IsCompleteComponent.sol";
import { IndexQuestComponent, ID as IndexQuestCompID } from "components/IndexQuestComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

import { LibCoin } from "libraries/LibCoin.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibRegistryQuests } from "libraries/LibRegistryQuests.sol";
import { LibString } from "solady/utils/LibString.sol";

/*
 * LibQuests handles quests!
 *
 * Quest have arrays of Requirements, Objectives, and Rewards
 * Only Quest is copied to an Account, the rest are referenced to a registry
 */
library LibQuests {
  /////////////////
  // INTERACTIONS

  /**
   * assigns a quest to an account, from the registry.
   * an assigned quest has:
   * - the quest index it's referencing
   * - the account it's assigned to
   * - completion status (defaults to false, therefore unassigned)
   * - TODO: the stored balances of the account at the time of assignment
   */
  function assignQuest(
    IWorld world,
    IUintComp components,
    uint256 questIndex,
    uint256 accountID
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();

    setAccountId(components, id, accountID);
    setIsQuest(components, id);
    setQuestIndex(components, id, questIndex);
    setTimeStart(components, id, block.timestamp);

    // snapshot objectives values if logic type needs it
    uint256[] memory objectives = LibRegistryQuests.getObjectivesByQuestIndex(
      components,
      questIndex
    );
    for (uint256 i; i < objectives.length; i++) {
      string memory logicType = getLogicType(components, objectives[i]);
      // unsure if using string operations is the best practice here
      if (LibString.startsWith(logicType, "DELTA")) {
        snapshotCondition(world, components, id, objectives[i], accountID);
      }
    }
  }

  function completeQuest(
    IWorld world,
    IUintComp components,
    uint256 questID,
    uint256 accountID
  ) internal {
    require(isQuest(components, questID), "Quests: not a quest");
    require(!isCompleted(components, questID), "Quests: alr completed");
    setCompleted(components, questID);

    uint256 questIndex = getQuestIndex(components, questID);
    distributeRewards(world, components, questIndex, accountID);
  }

  // snapshots current state of an account for required fields, if needed
  // stores child entities, eg inventory, on the quest entity itself
  function snapshotCondition(
    IWorld world,
    IUintComp components,
    uint256 questID,
    uint256 conditionID,
    uint256 accountID
  ) internal returns (uint256 id) {
    string memory _type = getType(components, conditionID);
    uint256 itemIndex;
    if (LibString.eq(_type, "FUNG_INVENTORY")) {
      // conditions only can hold 1 inventory type
      uint256 invID = LibInventory.getAllForHolder(components, conditionID)[0];
      itemIndex = LibInventory.getItemIndex(components, invID);
    }

    uint256 amount = getBalanceOf(components, accountID, itemIndex, _type);

    // setting values. since quest is a new entity, create a new inventory for each type
    if (LibString.eq(_type, "FUNG_INVENTORY")) {
      uint256 invID = LibInventory.create(world, components, questID, itemIndex);
      LibInventory.inc(components, invID, amount);
    } else if (LibString.eq(_type, "COIN")) {
      LibCoin._set(components, questID, amount);
    } else {
      require(false, "Quests: unknown type");
    }
  }

  /////////////////
  // CONDITIONS CHECK

  function checkRequirements(
    IUintComp components,
    uint256 questID,
    uint256 accountID
  ) internal view returns (bool result) {
    uint256 questIndex = getQuestIndex(components, questID);

    uint256[] memory requirements = LibRegistryQuests.getRequirementsByQuestIndex(
      components,
      questIndex
    );

    if (requirements.length == 0) {
      return true;
    }

    return checkConditions(components, questID, accountID, requirements);
  }

  function checkObjectives(
    IUintComp components,
    uint256 questID,
    uint256 accountID
  ) internal view returns (bool result) {
    uint256 questIndex = getQuestIndex(components, questID);

    uint256[] memory objectives = LibRegistryQuests.getObjectivesByQuestIndex(
      components,
      questIndex
    );

    if (objectives.length == 0) {
      return true;
    }

    return checkConditions(components, questID, accountID, objectives);
  }

  // checks if conditions are fufilled, AND logic
  function checkConditions(
    IUintComp components,
    uint256 questID,
    uint256 accountID,
    uint256[] memory conditions
  ) internal view returns (bool result) {
    for (uint256 i = 0; i < conditions.length; i++) {
      string memory logicType = getLogicType(components, conditions[i]);
      if (LibString.eq(logicType, "CURR_MIN")) {
        result = checkCurrMin(components, conditions[i], accountID);
      } else if (LibString.eq(logicType, "CURR_MAX")) {
        result = checkCurrMax(components, conditions[i], accountID);
      } else if (LibString.eq(logicType, "DELTA_MIN")) {
        result = checkDeltaMin(components, conditions[i], questID, accountID);
      } else if (LibString.eq(logicType, "DELTA_MAX")) {
        result = checkDeltaMax(components, conditions[i], questID, accountID);
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

  function checkCurrMax(
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
    uint256 maxBal = getBalanceOf(components, conditionID, itemIndex, _type);

    // check account
    uint256 accountValue = getBalanceOf(components, accountID, itemIndex, _type);

    return accountValue <= maxBal;
  }

  function checkDeltaMin(
    IUintComp components,
    uint256 conditionID,
    uint256 questID,
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
    uint256 delta = getBalanceOf(components, conditionID, itemIndex, _type);

    // check account
    uint256 currValue = getBalanceOf(components, accountID, itemIndex, _type);
    uint256 prevValue = getBalanceOf(components, questID, itemIndex, _type);

    return delta <= currValue - prevValue;
  }

  function checkDeltaMax(
    IUintComp components,
    uint256 conditionID,
    uint256 questID,
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
    uint256 delta = getBalanceOf(components, conditionID, itemIndex, _type);

    // check account
    uint256 currValue = getBalanceOf(components, accountID, itemIndex, _type);
    uint256 prevValue = getBalanceOf(components, questID, itemIndex, _type);

    return delta >= currValue - prevValue;
  }

  /////////////////
  // REWARDS DISTRIBUTION

  function distributeRewards(
    IWorld world,
    IUintComp components,
    uint256 questIndex,
    uint256 accountID
  ) internal {
    uint256[] memory rewards = LibRegistryQuests.getRewardsByQuestIndex(components, questIndex);

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
    return IsCompleteComponent(getAddressById(components, CompletionCompID)).has(id);
  }

  /////////////////
  // SETTERS

  function setAccountId(IUintComp components, uint256 id, uint256 accountID) internal {
    IdAccountComponent(getAddressById(components, IdAccountCompID)).set(id, accountID);
  }

  function setCompleted(IUintComp components, uint256 id) internal {
    IsCompleteComponent(getAddressById(components, CompletionCompID)).set(id);
  }

  function setIsQuest(IUintComp components, uint256 id) internal {
    IsQuestComponent(getAddressById(components, IsQuestCompID)).set(id);
  }

  function setQuestIndex(IUintComp components, uint256 id, uint256 index) internal {
    IndexQuestComponent(getAddressById(components, IndexQuestCompID)).set(id, index);
  }

  function setTimeStart(IUintComp components, uint256 id, uint256 time) internal {
    TimeStartComponent(getAddressById(components, TimeStartCompID)).set(id, time);
  }

  /////////////////
  // GETTERS

  function getAccountId(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdAccountComponent(getAddressById(components, IdAccountCompID)).getValue(id);
  }

  function getLogicType(IUintComp components, uint256 id) internal view returns (string memory) {
    return LogicTypeComponent(getAddressById(components, LogicTypeCompID)).getValue(id);
  }

  function getQuestIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexQuestComponent(getAddressById(components, IndexQuestCompID)).getValue(id);
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).getValue(id);
  }

  function getTimeStart(IUintComp components, uint256 id) internal view returns (uint256) {
    return TimeStartComponent(getAddressById(components, TimeStartCompID)).getValue(id);
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
}
