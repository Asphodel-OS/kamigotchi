// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IComponent as IComp } from "solecs/interfaces/IComponent.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { BalanceComponent, ID as BalCompID } from "components/BalanceComponent.sol";
import { HashComponent, ID as HashCompID } from "components/HashComponent.sol";
import { IdHolderComponent, ID as HolderCompID } from "components/IdHolderComponent.sol";
import { IdOwnsQuestComponent, ID as OwnQuestCompID } from "components/IdOwnsQuestComponent.sol";
import { IsObjectiveComponent, ID as IsObjectiveCompID } from "components/IsObjectiveComponent.sol";
import { IsRepeatableComponent, ID as IsRepeatableCompID } from "components/IsRepeatableComponent.sol";
import { IsRewardComponent, ID as IsRewardCompID } from "components/IsRewardComponent.sol";
import { IsQuestComponent, ID as IsQuestCompID } from "components/IsQuestComponent.sol";
import { IsCompleteComponent, ID as IsCompleteCompID } from "components/IsCompleteComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IndexQuestComponent, ID as IndexQuestCompID } from "components/IndexQuestComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { TimeComponent, ID as TimeCompID } from "components/TimeComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LOGIC, HANDLER, LibBoolean } from "libraries/utils/LibBoolean.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibHash } from "libraries/utils/LibHash.sol";
import { LibQuestRegistry } from "libraries/LibQuestRegistry.sol";

/**
 * @notice LibQuests handles quests!
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
    uint32 questIndex,
    uint256 accountID
  ) internal returns (uint256 id) {
    id = genQuestID(questIndex, accountID);

    setOwner(components, id, accountID);
    setIsQuest(components, id);
    setQuestIndex(components, id, questIndex);
    setTimeStart(components, id, block.timestamp);

    // snapshot objectives values if logic type needs it
    uint256[] memory objectives = LibQuestRegistry.getObjectivesByQuestIndex(
      components,
      questIndex
    );
    for (uint256 i; i < objectives.length; i++) {
      string memory logicType = getLogicType(components, objectives[i]);
      (HANDLER handler, ) = LibBoolean.parseLogic(logicType);
      if (handler == HANDLER.INCREASE || handler == HANDLER.DECREASE) {
        snapshotObjective(components, id, objectives[i], accountID);
      }
    }
  }

  function assignRepeatable(
    IWorld world,
    IUintComp components,
    uint32 questIndex,
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
      id = assign(world, components, questIndex, accountID);
      setIsRepeatable(components, id);
    }

    // snapshot objectives values if logic type needs it
    uint256[] memory objectives = LibQuestRegistry.getObjectivesByQuestIndex(
      components,
      questIndex
    );
    for (uint256 i; i < objectives.length; i++) {
      string memory logicType = getLogicType(components, objectives[i]);
      (HANDLER handler, ) = LibBoolean.parseLogic(logicType);
      if (handler == HANDLER.INCREASE || handler == HANDLER.DECREASE) {
        snapshotObjective(components, id, objectives[i], accountID);
      }
    }
  }

  function complete(
    IWorld world,
    IUintComp components,
    uint256 questID,
    uint256 accountID
  ) internal {
    setCompleted(components, questID);
    removeSnapshottedObjectives(components, questID);

    uint32 questIndex = getQuestIndex(components, questID);
    distributeRewards(world, components, questIndex, accountID);
  }

  function drop(IUintComp components, uint256 questID) internal {
    unsetIsQuest(components, questID);
    unsetQuestIndex(components, questID);
    unsetTimeStart(components, questID);
    unsetOwner(components, questID);

    if (isRepeatable(components, questID)) unsetIsRepeatable(components, questID);

    removeSnapshottedObjectives(components, questID);
  }

  // snapshots current state of an account for required fields, if needed
  // stores child entities, eg inventory, on the quest entity itself
  function snapshotObjective(
    IUintComp components,
    uint256 questID,
    uint256 conditionID,
    uint256 accountID
  ) internal returns (uint256) {
    string memory _type = getType(components, conditionID);
    uint32 index = getIndex(components, conditionID);

    uint256 amount = LibDataEntity.get(components, accountID, index, _type);

    // copy an objective
    uint256 id = genObjSnapshotID(questID, LibHash.get(components, conditionID));
    setBalance(components, id, amount);

    setIsObjective(components, id); // deterministic id suppliment - could be removed
    setOwner(components, id, questID); // deterministic id suppliment - could be removed

    return id;
  }

  function removeSnapshottedObjectives(IUintComp components, uint256 questID) internal {
    uint256[] memory objectives = querySnapshottedObjectives(components, questID);
    for (uint256 i; i < objectives.length; i++) {
      unsetIsObjective(components, objectives[i]);
      unsetOwner(components, objectives[i]);
      unsetBalance(components, objectives[i]);
      LibHash.remove(components, objectives[i]);
    }
  }

  function checkRepeat(
    IUintComp components,
    uint32 questIndex,
    uint256 repeatQuestID
  ) internal view returns (bool) {
    // true if first time accepting
    if (repeatQuestID == 0) return true;

    // false if quest not completed
    if (!isCompleted(components, repeatQuestID)) return false;

    // can accept if time passed
    uint256 timeStart = getTimeStart(components, repeatQuestID);
    uint256 regID = LibQuestRegistry.getByQuestIndex(components, questIndex);
    uint256 duration = getTime(components, regID);
    return block.timestamp > timeStart + duration;
  }

  function checkRequirements(
    IUintComp components,
    uint32 questIndex,
    uint256 accountID
  ) internal view returns (bool result) {
    uint256[] memory requirements = LibQuestRegistry.getRequirementsByQuestIndex(
      components,
      questIndex
    );

    for (uint256 i; i < requirements.length; i++) {
      string memory logicType = getLogicType(components, requirements[i]);
      (HANDLER handler, LOGIC operator) = LibBoolean.parseLogic(logicType);

      if (handler == HANDLER.CURRENT) {
        result = checkCurrent(components, requirements[i], accountID, operator);
      } else if (handler == HANDLER.BOOLEAN) {
        result = checkBoolean(components, requirements[i], accountID, operator);
      } else {
        require(false, "Unknown requirement logic type");
      }

      if (!result) return false;
    }

    return true;
  }

  function checkObjectives(
    IUintComp components,
    uint256 questID,
    uint256 accountID
  ) internal view returns (bool result) {
    uint32 questIndex = getQuestIndex(components, questID);

    uint256[] memory objectives = LibQuestRegistry.getObjectivesByQuestIndex(
      components,
      questIndex
    );

    for (uint256 i; i < objectives.length; i++) {
      string memory logicType = getLogicType(components, objectives[i]);
      (HANDLER handler, LOGIC operator) = LibBoolean.parseLogic(logicType);

      if (handler == HANDLER.CURRENT) {
        result = checkCurrent(components, objectives[i], accountID, operator);
      } else if (handler == HANDLER.INCREASE) {
        result = checkIncrease(components, objectives[i], questID, accountID, operator);
      } else if (handler == HANDLER.DECREASE) {
        result = checkDecrease(components, objectives[i], questID, accountID, operator);
      } else if (handler == HANDLER.BOOLEAN) {
        result = checkBoolean(components, objectives[i], accountID, operator);
      } else {
        require(false, "Unknown condition handler");
      }

      if (!result) return false;
    }

    return true;
  }

  function distributeRewards(
    IWorld world,
    IUintComp components,
    uint32 questIndex,
    uint256 accountID
  ) internal {
    uint256[] memory rewards = LibQuestRegistry.getRewardsByQuestIndex(components, questIndex);

    for (uint256 i = 0; i < rewards.length; i++) {
      string memory _type = getType(components, rewards[i]);
      uint32 index = getIndex(components, rewards[i]);
      uint256 amount = getBalance(components, rewards[i]);
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
    uint32 index = getIndex(components, conditionID);
    uint256 expected = getBalance(components, conditionID);

    return LibBoolean.checkCurr(components, accountID, index, expected, _type, logic);
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
    uint32 index = getIndex(components, conditionID);
    uint256 currValue = LibDataEntity.get(components, accountID, index, _type);

    uint256 snapshotID = getSnapshotObjective(components, questID, conditionID);
    require(
      snapshotID != 0,
      "Quests: obj not found. If quest has been recently upgraded, try dropping and accepting again"
    ); // longtext >< for a user call to action
    uint256 prevValue = getBalance(components, snapshotID);

    // overall value decreased - condition not be met, will overflow if checked
    if (prevValue > currValue) {
      return false;
    }

    uint256 delta = getBalance(components, conditionID);
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
    uint32 index = getIndex(components, conditionID);
    uint256 currValue = LibDataEntity.get(components, accountID, index, _type);

    uint256 snapshotID = getSnapshotObjective(components, questID, conditionID);
    require(
      snapshotID != 0,
      "Quests: obj not found. If quest has been recently upgraded, try dropping and accepting again"
    ); // longtext >< for a user call to action
    uint256 prevValue = getBalance(components, snapshotID);

    // overall value increased - condition not be met, will overflow if checked
    if (currValue > prevValue) {
      return false;
    }

    uint256 delta = getBalance(components, conditionID);
    return LibBoolean._checkLogicOperator(prevValue - currValue, delta, logic);
  }

  function checkBoolean(
    IUintComp components,
    uint256 conditionID,
    uint256 accountID,
    LOGIC logic
  ) internal view returns (bool result) {
    string memory _type = getType(components, conditionID);
    uint32 index = getIndex(components, conditionID);
    uint256 value = getBalance(components, conditionID);

    return LibBoolean.checkBool(components, accountID, index, value, _type, logic);
  }

  // checks if an account has completed a quest
  function checkAccQuestComplete(
    IUintComp components,
    uint32 questIndex,
    uint256 accountID
  ) internal view returns (bool) {
    uint256 id = queryAccountQuestIndex(components, accountID, questIndex);
    return id != 0 ? isCompleted(components, id) : false;
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

  function isObjective(IUintComp components, uint256 id) internal view returns (bool) {
    return IsObjectiveComponent(getAddressById(components, IsObjectiveCompID)).has(id);
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

  function setBalance(IUintComp components, uint256 id, uint256 value) internal {
    BalanceComponent(getAddressById(components, BalCompID)).set(id, value);
  }

  function setCompleted(IUintComp components, uint256 id) internal {
    IsCompleteComponent(getAddressById(components, IsCompleteCompID)).set(id);
  }

  function setOwner(IUintComp components, uint256 id, uint256 value) internal {
    IdOwnsQuestComponent(getAddressById(components, OwnQuestCompID)).set(id, value);
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

  function setIndex(IUintComp components, uint256 id, uint32 index) internal {
    IndexComponent(getAddressById(components, IndexCompID)).set(id, index);
  }

  function setLogicType(IUintComp components, uint256 id, string memory logicType) internal {
    LogicTypeComponent(getAddressById(components, LogicTypeCompID)).set(id, logicType);
  }

  function setQuestIndex(IUintComp components, uint256 id, uint32 index) internal {
    IndexQuestComponent(getAddressById(components, IndexQuestCompID)).set(id, index);
  }

  function setTimeStart(IUintComp components, uint256 id, uint256 time) internal {
    TimeStartComponent(getAddressById(components, TimeStartCompID)).set(id, time);
  }

  function setType(IUintComp components, uint256 id, string memory type_) internal {
    TypeComponent(getAddressById(components, TypeCompID)).set(id, type_);
  }

  function unsetBalance(IUintComp components, uint256 id) internal {
    BalanceComponent(getAddressById(components, BalCompID)).remove(id);
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

  function unsetOwner(IUintComp components, uint256 id) internal {
    IdOwnsQuestComponent(getAddressById(components, OwnQuestCompID)).remove(id);
  }

  function unsetQuestIndex(IUintComp components, uint256 id) internal {
    IndexQuestComponent(getAddressById(components, IndexQuestCompID)).remove(id);
  }

  function unsetTimeStart(IUintComp components, uint256 id) internal {
    TimeStartComponent(getAddressById(components, TimeStartCompID)).remove(id);
  }

  /////////////////
  // GETTERS

  function getBalance(IUintComp components, uint256 id) internal view returns (uint256) {
    BalanceComponent comp = BalanceComponent(getAddressById(components, BalCompID));
    return comp.has(id) ? comp.get(id) : 0;
  }

  function getLogicType(IUintComp components, uint256 id) internal view returns (string memory) {
    return LogicTypeComponent(getAddressById(components, LogicTypeCompID)).get(id);
  }

  function getQuestIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexQuestComponent(getAddressById(components, IndexQuestCompID)).get(id);
  }

  function getOwner(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdOwnsQuestComponent(getAddressById(components, OwnQuestCompID)).get(id);
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).get(id);
  }

  function getTimeStart(IUintComp components, uint256 id) internal view returns (uint256) {
    return TimeStartComponent(getAddressById(components, TimeStartCompID)).get(id);
  }

  function getTime(IUintComp components, uint256 id) internal view returns (uint256) {
    return TimeComponent(getAddressById(components, TimeCompID)).get(id);
  }

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    IndexComponent comp = IndexComponent(getAddressById(components, IndexCompID));
    return comp.has(id) ? comp.get(id) : 0;
  }

  ////////////////
  // UTILS

  function getSnapshotObjective(
    IUintComp components,
    uint256 questID,
    uint256 regConID
  ) internal view returns (uint256) {
    uint256 id = genObjSnapshotID(questID, LibHash.get(components, regConID));
    return isObjective(components, id) ? id : 0;
  }

  /////////////////
  // QUERIES

  function queryAccountQuestIndex(
    IUintComp components,
    uint256 accountID,
    uint32 questIndex
  ) internal view returns (uint256) {
    uint256 id = genQuestID(questIndex, accountID);

    return isQuest(components, id) ? id : 0;
  }

  function querySnapshottedObjectives(
    IUintComp components,
    uint256 questID
  ) internal view returns (uint256[] memory) {
    return
      LibQuery.getIsWithValue(
        getComponentById(components, OwnQuestCompID),
        getComponentById(components, IsObjectiveCompID),
        abi.encode(questID)
      );
  }

  ////////////////////
  // LOGGING

  function logComplete(IUintComp components, uint256 accountID) internal {
    LibDataEntity.inc(components, accountID, 0, "QUEST_COMPLETE", 1);
  }

  function logCompleteRepeatable(
    IUintComp components,
    uint256 accountID,
    uint256 questID
  ) internal {
    if (isRepeatable(components, questID))
      LibDataEntity.inc(components, accountID, 0, "QUEST_REPEATABLE_COMPLETE", 1);
  }

  ///////////////////////
  // UTILS

  function genQuestID(uint32 index, uint256 accountID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("registry.quest", index, accountID)));
  }

  function genObjSnapshotID(uint256 questID, uint256 objHash) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("quest.objective.snapshot", questID, objHash)));
  }
}
