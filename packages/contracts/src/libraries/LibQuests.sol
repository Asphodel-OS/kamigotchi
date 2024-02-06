// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IComponent as IComp } from "solecs/interfaces/IComponent.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IdAccountComponent, ID as IdAccountCompID } from "components/IdAccountComponent.sol";
import { IdHolderComponent, ID as HolderCompID } from "components/IdHolderComponent.sol";
import { IsObjectiveComponent, ID as IsObjectiveCompID } from "components/IsObjectiveComponent.sol";
import { IsRepeatableComponent, ID as IsRepeatableCompID } from "components/IsRepeatableComponent.sol";
import { IsRewardComponent, ID as IsRewardCompID } from "components/IsRewardComponent.sol";
import { IsQuestComponent, ID as IsQuestCompID } from "components/IsQuestComponent.sol";
import { IsCompleteComponent, ID as IsCompleteCompID } from "components/IsCompleteComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IndexQuestComponent, ID as IndexQuestCompID } from "components/IndexQuestComponent.sol";
import { IndexObjectiveComponent, ID as IndexObjectiveCompID } from "components/IndexObjectiveComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { MaxComponent, ID as MaxCompID } from "components/MaxComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { TimeComponent, ID as TimeCompID } from "components/TimeComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibRegistryQuests } from "libraries/LibRegistryQuests.sol";
import { LOGIC, HANDLER, LibBoolean } from "libraries/LibBoolean.sol";

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
   */
  function assign(
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
      (HANDLER handler, ) = parseObjectiveLogic(logicType);
      if (handler == HANDLER.INCREASE || handler == HANDLER.DECREASE) {
        snapshotObjective(world, components, id, objectives[i], accountID);
      }
    }
  }

  function assignRepeatable(
    IWorld world,
    IUintComp components,
    uint256 questIndex,
    uint256 repeatQuestID,
    uint256 accountID
  ) internal returns (uint256 id) {
    // if repeatable already exists, overwrite it
    if (repeatQuestID != 0) {
      id = repeatQuestID;

      // previous objective snapshot are unset during quest completion
      unsetCompleted(components, id);
      setTimeStart(components, id, block.timestamp);
    } else {
      id = world.getUniqueEntityId();

      setAccountId(components, id, accountID);
      setIsQuest(components, id);
      setQuestIndex(components, id, questIndex);
      setTimeStart(components, id, block.timestamp);
      setIsRepeatable(components, id);
    }

    // snapshot objectives values if logic type needs it
    uint256[] memory objectives = LibRegistryQuests.getObjectivesByQuestIndex(
      components,
      questIndex
    );
    for (uint256 i; i < objectives.length; i++) {
      string memory logicType = getLogicType(components, objectives[i]);
      (HANDLER handler, ) = parseObjectiveLogic(logicType);
      if (handler == HANDLER.INCREASE || handler == HANDLER.DECREASE) {
        snapshotObjective(world, components, id, objectives[i], accountID);
      }
    }
  }

  function complete(
    IWorld world,
    IUintComp components,
    uint256 questID,
    uint256 accountID
  ) internal {
    require(!isCompleted(components, questID), "Quests: alr completed");
    setCompleted(components, questID);

    removeSnapshottedObjectives(components, questID);

    uint256 questIndex = getQuestIndex(components, questID);
    distributeRewards(world, components, questIndex, accountID);
  }

  function drop(IUintComp components, uint256 questID) internal {
    require(!isCompleted(components, questID), "Quests: alr completed");

    unsetIsQuest(components, questID);
    unsetQuestIndex(components, questID);
    unsetTimeStart(components, questID);
    unsetAccountId(components, questID);

    if (isRepeatable(components, questID)) unsetIsRepeatable(components, questID);

    removeSnapshottedObjectives(components, questID);
  }

  // snapshots current state of an account for required fields, if needed
  // stores child entities, eg inventory, on the quest entity itself
  function snapshotObjective(
    IWorld world,
    IUintComp components,
    uint256 questID,
    uint256 conditionID,
    uint256 accountID
  ) internal returns (uint256) {
    string memory _type = getType(components, conditionID);
    uint256 index = getIndex(components, conditionID);

    uint256 amount = LibDataEntity.get(components, accountID, index, _type);

    // copy an objective
    uint256 id = world.getUniqueEntityId();
    setIsObjective(components, id);
    setHolderId(components, id, questID);
    setObjectiveIndex(components, id, getObjectiveIndex(components, conditionID));
    setValue(components, id, amount);

    return id;
  }

  function removeSnapshottedObjectives(IUintComp components, uint256 questID) internal {
    uint256[] memory objectives = querySnapshottedObjectives(components, questID);
    for (uint256 i; i < objectives.length; i++) {
      unsetIsObjective(components, questID);
      unsetHolderId(components, questID);
      unsetObjectiveIndex(components, questID);
      unsetValue(components, questID);
    }
  }

  // if not repeatable, quests can only be accepted and completed once
  function checkMax(
    IUintComp components,
    uint256 questID,
    uint256 questIndex,
    uint256 accountID
  ) internal view returns (bool) {
    uint256[] memory quests = queryAccountQuestIndex(components, accountID, questIndex);
    return quests.length < 1;
  }

  function checkRepeat(
    IUintComp components,
    uint256 questIndex,
    uint256 repeatQuestID
  ) internal view returns (bool) {
    // true if first time accepting
    if (repeatQuestID == 0) return true;

    // false if quest not completed
    if (!isCompleted(components, repeatQuestID)) return false;

    // can accept if time passed
    uint256 timeStart = getTimeStart(components, repeatQuestID);
    uint256 regID = LibRegistryQuests.getByQuestIndex(components, questIndex);
    uint256 duration = getTime(components, regID);
    return block.timestamp > timeStart + duration;
  }

  // splits based on logicType. requirements are simpler than objectives
  // list of logicTypes:
  // AT: equal, current location
  // COMPLETE: equal, if index is completed
  // HAVE: min current balance
  // GREATER: min current balance
  // LESSER: max current balance
  // EQUAL: equal current balance
  // USE: min current balance, but consumes resource
  function checkRequirements(
    IUintComp components,
    uint256 questID,
    uint256 questIndex,
    uint256 accountID
  ) internal view returns (bool) {
    uint256[] memory requirements = LibRegistryQuests.getRequirementsByQuestIndex(
      components,
      questIndex
    );

    for (uint256 i; i < requirements.length; i++) {
      string memory logicType = getLogicType(components, requirements[i]);
      bool result;

      if (LibString.eq(logicType, "AT")) {
        result = checkCurrent(components, requirements[i], accountID, LOGIC.EQUAL);
      } else if (LibString.eq(logicType, "COMPLETE")) {
        result = checkBoolean(components, requirements[i], accountID, LOGIC.IS);
      } else if (LibString.eq(logicType, "HAVE")) {
        result = checkCurrent(components, requirements[i], accountID, LOGIC.MIN);
      } else if (LibString.eq(logicType, "GREATER")) {
        result = checkCurrent(components, requirements[i], accountID, LOGIC.MIN);
      } else if (LibString.eq(logicType, "LESSER")) {
        result = checkCurrent(components, requirements[i], accountID, LOGIC.MAX);
      } else if (LibString.eq(logicType, "EQUAL")) {
        result = checkCurrent(components, requirements[i], accountID, LOGIC.EQUAL);
      } else if (LibString.eq(logicType, "USE")) {
        result = checkUseCurrent(components, requirements[i], accountID, LOGIC.MIN);
        // TODO: implement use logic
      } else {
        require(false, "Unknown requirement logic type");
      }

      if (!result) {
        return false;
      }
    }

    return true;
  }

  // splits based on logicType. list of logicTypes:
  // AT: equal, current location
  // BUY: min delta increase, shop items
  // HAVE: min current balance
  // GATHER: min delta increase, COIN
  // MINT: min delta increase, Pets (721)
  // USE: min delta decrease, shop items
  function checkObjectives(
    IUintComp components,
    uint256 questID,
    uint256 accountID
  ) internal view returns (bool) {
    uint256 questIndex = getQuestIndex(components, questID);

    uint256[] memory objectives = LibRegistryQuests.getObjectivesByQuestIndex(
      components,
      questIndex
    );

    for (uint256 i; i < objectives.length; i++) {
      string memory logicType = getLogicType(components, objectives[i]);
      bool result;

      (HANDLER handler, LOGIC operator) = parseObjectiveLogic(logicType);

      if (handler == HANDLER.CURRENT) {
        result = checkCurrent(components, objectives[i], accountID, operator);
      } else if (handler == HANDLER.INCREASE) {
        result = checkIncrease(components, objectives[i], questID, accountID, operator);
      } else if (handler == HANDLER.DECREASE) {
        result = checkDecrease(components, objectives[i], questID, accountID, operator);
      } else {
        require(false, "Unknown condition handler");
      }

      if (!result) {
        return false;
      }
    }

    return true;
  }

  function distributeRewards(
    IWorld world,
    IUintComp components,
    uint256 questIndex,
    uint256 accountID
  ) internal {
    uint256[] memory rewards = LibRegistryQuests.getRewardsByQuestIndex(components, questIndex);

    for (uint256 i = 0; i < rewards.length; i++) {
      string memory _type = getType(components, rewards[i]);
      uint256 index = getIndex(components, rewards[i]);
      uint256 amount = getValue(components, rewards[i]);
      LibAccount.incBalanceOf(world, components, accountID, _type, index, amount);
    }
  }

  function checkCurrent(
    IUintComp components,
    uint256 conditionID,
    uint256 accountID,
    LOGIC logic
  ) internal view returns (bool) {
    // details of condition
    string memory _type = getType(components, conditionID);
    uint256 index = getIndex(components, conditionID);
    uint256 expected = getValue(components, conditionID);

    return LibBoolean.checkCurr(components, accountID, index, expected, 0, _type, logic);
  }

  function checkUseCurrent(
    IUintComp components,
    uint256 conditionID,
    uint256 accountID,
    LOGIC logic
  ) internal view returns (bool) {
    // details of condition
    string memory _type = getType(components, conditionID);
    uint256 index = getIndex(components, conditionID);
    uint256 expected = getValue(components, conditionID);

    // check account
    uint256 accountValue = LibAccount.getBalanceOf(components, accountID, _type, index);

    // TODO: implement use logic

    return LibBoolean._checkLogicOperator(accountValue, expected, logic);
  }

  function checkIncrease(
    IUintComp components,
    uint256 conditionID,
    uint256 questID,
    uint256 accountID,
    LOGIC logic
  ) internal view returns (bool) {
    // details of condition
    string memory _type = getType(components, conditionID);
    uint256 index = getIndex(components, conditionID);
    uint256 currValue = LibDataEntity.get(components, accountID, index, _type);

    uint256 snapshotID = getSnapshotObjective(components, questID, conditionID);
    uint256 prevValue = getValue(components, snapshotID);

    // overall value decreased - condition not be met, will overflow if checked
    if (prevValue > currValue) {
      return false;
    }

    uint256 delta = getValue(components, conditionID);
    return LibBoolean._checkLogicOperator(currValue - prevValue, delta, logic);
  }

  function checkDecrease(
    IUintComp components,
    uint256 conditionID,
    uint256 questID,
    uint256 accountID,
    LOGIC logic
  ) internal view returns (bool) {
    // details of condition
    string memory _type = getType(components, conditionID);
    uint256 index = getIndex(components, conditionID);
    uint256 currValue = LibDataEntity.get(components, accountID, index, _type);

    uint256 snapshotID = getSnapshotObjective(components, questID, conditionID);
    uint256 prevValue = getValue(components, snapshotID);

    // overall value increased - condition not be met, will overflow if checked
    if (currValue > prevValue) {
      return false;
    }

    uint256 delta = getValue(components, conditionID);
    return LibBoolean._checkLogicOperator(prevValue - currValue, delta, logic);
  }

  function checkBoolean(
    IUintComp components,
    uint256 conditionID,
    uint256 accountID,
    LOGIC logic
  ) internal view returns (bool result) {
    string memory _type = getType(components, conditionID);

    if (LibString.eq(_type, "QUEST")) {
      uint256 questIndex = getValue(components, conditionID);
      result = checkAccQuestComplete(components, questIndex, accountID);
    }

    if (logic == LOGIC.NOT) {
      result = !result;
    } else {
      require(logic == LOGIC.IS, "Unknown bool logic operator");
    }
  }

  // checks if an account has completed a quest
  function checkAccQuestComplete(
    IUintComp components,
    uint256 questIndex,
    uint256 accountID
  ) internal view returns (bool) {
    uint256[] memory completedQuests = queryCompletedQuests(components, accountID, questIndex);
    return completedQuests.length > 0;
  }

  /////////////////
  // CHECKERS

  function hasIndex(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexComponent(getAddressById(components, IndexCompID)).has(id);
  }

  function isQuest(IUintComp components, uint256 id) internal view returns (bool) {
    return IsQuestComponent(getAddressById(components, IsQuestCompID)).has(id);
  }

  function isRepeatable(IUintComp components, uint256 id) internal view returns (bool) {
    return IsRepeatableComponent(getAddressById(components, IsRepeatableCompID)).has(id);
  }

  function isType(
    IUintComp components,
    uint256 id,
    string memory _type
  ) internal view returns (bool) {
    return TypeComponent(getAddressById(components, TypeCompID)).hasValue(id, _type);
  }

  function isCompleted(IUintComp components, uint256 id) internal view returns (bool) {
    return IsCompleteComponent(getAddressById(components, IsCompleteCompID)).has(id);
  }

  /////////////////
  // SETTERS

  function setAccountId(IUintComp components, uint256 id, uint256 accountID) internal {
    IdAccountComponent(getAddressById(components, IdAccountCompID)).set(id, accountID);
  }

  function setCompleted(IUintComp components, uint256 id) internal {
    IsCompleteComponent(getAddressById(components, IsCompleteCompID)).set(id);
  }

  function setHolderId(IUintComp components, uint256 id, uint256 holderID) internal {
    IdHolderComponent(getAddressById(components, HolderCompID)).set(id, holderID);
  }

  function setIsQuest(IUintComp components, uint256 id) internal {
    IsQuestComponent(getAddressById(components, IsQuestCompID)).set(id);
  }

  function setIsRepeatable(IUintComp components, uint256 id) internal {
    IsRepeatableComponent(getAddressById(components, IsRepeatableCompID)).set(id);
  }

  function setIsObjective(IUintComp components, uint256 id) internal {
    IsObjectiveComponent(getAddressById(components, IsObjectiveCompID)).set(id);
  }

  function setIndex(IUintComp components, uint256 id, uint256 index) internal {
    IndexComponent(getAddressById(components, IndexCompID)).set(id, index);
  }

  function setLogicType(IUintComp components, uint256 id, string memory logicType) internal {
    LogicTypeComponent(getAddressById(components, LogicTypeCompID)).set(id, logicType);
  }

  function setQuestIndex(IUintComp components, uint256 id, uint256 index) internal {
    IndexQuestComponent(getAddressById(components, IndexQuestCompID)).set(id, index);
  }

  function setObjectiveIndex(IUintComp components, uint256 id, uint256 index) internal {
    IndexObjectiveComponent(getAddressById(components, IndexObjectiveCompID)).set(id, index);
  }

  function setTimeStart(IUintComp components, uint256 id, uint256 time) internal {
    TimeStartComponent(getAddressById(components, TimeStartCompID)).set(id, time);
  }

  function setType(IUintComp components, uint256 id, string memory type_) internal {
    TypeComponent(getAddressById(components, TypeCompID)).set(id, type_);
  }

  function setValue(IUintComp components, uint256 id, uint256 value) internal {
    ValueComponent(getAddressById(components, ValueCompID)).set(id, value);
  }

  function unsetAccountId(IUintComp components, uint256 id) internal {
    IdAccountComponent(getAddressById(components, IdAccountCompID)).remove(id);
  }

  function unsetCompleted(IUintComp components, uint256 id) internal {
    IsCompleteComponent(getAddressById(components, IsCompleteCompID)).remove(id);
  }

  function unsetIsQuest(IUintComp components, uint256 id) internal {
    IsQuestComponent(getAddressById(components, IsQuestCompID)).remove(id);
  }

  function unsetIsRepeatable(IUintComp components, uint256 id) internal {
    IsRepeatableComponent(getAddressById(components, IsRepeatableCompID)).remove(id);
  }

  function unsetIsObjective(IUintComp components, uint256 id) internal {
    IsObjectiveComponent(getAddressById(components, IsObjectiveCompID)).remove(id);
  }

  function unsetHolderId(IUintComp components, uint256 id) internal {
    IdHolderComponent(getAddressById(components, HolderCompID)).remove(id);
  }

  function unsetQuestIndex(IUintComp components, uint256 id) internal {
    IndexQuestComponent(getAddressById(components, IndexQuestCompID)).remove(id);
  }

  function unsetTimeStart(IUintComp components, uint256 id) internal {
    TimeStartComponent(getAddressById(components, TimeStartCompID)).remove(id);
  }

  function unsetObjectiveIndex(IUintComp components, uint256 id) internal {
    IndexObjectiveComponent(getAddressById(components, IndexObjectiveCompID)).remove(id);
  }

  function unsetValue(IUintComp components, uint256 id) internal {
    ValueComponent(getAddressById(components, ValueCompID)).remove(id);
  }

  /////////////////
  // GETTERS

  function getAccountId(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdAccountComponent(getAddressById(components, IdAccountCompID)).getValue(id);
  }

  function getLogicType(IUintComp components, uint256 id) internal view returns (string memory) {
    return LogicTypeComponent(getAddressById(components, LogicTypeCompID)).getValue(id);
  }

  function getObjectiveIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexObjectiveComponent(getAddressById(components, IndexObjectiveCompID)).getValue(id);
  }

  function getMax(IUintComp components, uint256 id) internal view returns (uint256) {
    return MaxComponent(getAddressById(components, MaxCompID)).getValue(id);
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

  function getTime(IUintComp components, uint256 id) internal view returns (uint256) {
    return TimeComponent(getAddressById(components, TimeCompID)).getValue(id);
  }

  function getIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    if (hasIndex(components, id))
      return IndexComponent(getAddressById(components, IndexCompID)).getValue(id);
    else return 0;
  }

  function getValue(IUintComp components, uint256 id) internal view returns (uint256) {
    return ValueComponent(getAddressById(components, ValueCompID)).getValue(id);
  }

  ////////////////
  // UTILS

  // determins objective logic handler and operator
  function parseObjectiveLogic(string memory _type) internal pure returns (HANDLER, LOGIC) {
    return LibBoolean._parseLogic(_type);
  }

  function getSnapshotObjective(
    IUintComp components,
    uint256 questID,
    uint256 conditionID
  ) internal view returns (uint256) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(
      QueryType.Has,
      getComponentById(components, IsObjectiveCompID),
      ""
    );
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, HolderCompID),
      abi.encode(questID)
    );
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexObjectiveCompID),
      abi.encode(getObjectiveIndex(components, conditionID))
    );

    uint256[] memory results = LibQuery.query(fragments);
    return results[0];
  }

  /////////////////
  // QUERIES

  function queryAccountQuests(
    IUintComp components,
    uint256 accountID
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsQuestCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdAccountCompID),
      abi.encode(accountID)
    );

    return LibQuery.query(fragments);
  }

  function queryAccountQuestIndex(
    IUintComp components,
    uint256 accountID,
    uint256 questIndex
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsQuestCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdAccountCompID),
      abi.encode(accountID)
    );
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexQuestCompID),
      abi.encode(questIndex)
    );

    return LibQuery.query(fragments);
  }

  function querySnapshottedObjectives(
    IUintComp components,
    uint256 questID
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(
      QueryType.Has,
      getComponentById(components, IsObjectiveCompID),
      ""
    );
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, HolderCompID),
      abi.encode(questID)
    );

    return LibQuery.query(fragments);
  }

  function queryCompletedQuests(
    IUintComp components,
    uint256 accountID,
    uint256 questIndex
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](4);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsQuestCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IsCompleteCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdAccountCompID),
      abi.encode(accountID)
    );
    fragments[3] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexQuestCompID),
      abi.encode(questIndex)
    );

    return LibQuery.query(fragments);
  }

  function queryUncompletedQuests(
    IUintComp components,
    uint256 accountID,
    uint256 questIndex
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](4);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsQuestCompID), "");
    fragments[1] = QueryFragment(QueryType.Not, getComponentById(components, IsCompleteCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdAccountCompID),
      abi.encode(accountID)
    );
    fragments[3] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexQuestCompID),
      abi.encode(questIndex)
    );

    return LibQuery.query(fragments);
  }
}
