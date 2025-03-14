// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IComponent as IComp } from "solecs/interfaces/IComponent.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { IDOwnsQuestComponent, ID as OwnQuestCompID } from "components/IDOwnsQuestComponent.sol";
import { IsRepeatableComponent, ID as IsRepeatableCompID } from "components/IsRepeatableComponent.sol";
import { IsCompleteComponent, ID as IsCompleteCompID } from "components/IsCompleteComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IndexQuestComponent, ID as IndexQuestCompID } from "components/IndexQuestComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { TimeComponent, ID as TimeCompID } from "components/TimeComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LOGIC, HANDLER, Condition, LibConditional } from "libraries/LibConditional.sol";
import { LibData } from "libraries/LibData.sol";
import { LibQuestRegistry } from "libraries/LibQuestRegistry.sol";
import { LibAllo } from "libraries/LibAllo.sol";

/**
 * @notice LibQuests handles quests!
 *
 * Quest have arrays of Requirements, Objectives, and Rewards
 * Only Quest is copied to an Account, the rest are referenced to a registry
 */
library LibQuests {
  using LibComp for IComp;

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
    uint256 accID
  ) internal returns (uint256 id) {
    id = genQuestID(questIndex, accID);

    LibEntityType.set(components, id, "QUEST");
    IDOwnsQuestComponent(getAddrByID(components, OwnQuestCompID)).set(id, accID); // TODO: change to holderID
    IndexQuestComponent(getAddrByID(components, IndexQuestCompID)).set(id, questIndex);
    TimeStartComponent(getAddrByID(components, TimeStartCompID)).set(id, block.timestamp);

    snapshotObjectives(components, questIndex, id, accID);
  }

  function assignRepeatable(
    IWorld world,
    IUintComp components,
    uint32 questIndex,
    uint256 repeatQuestID,
    uint256 accID
  ) internal returns (uint256 id) {
    // if repeatable already exists, overwrite it
    if (repeatQuestID != 0) {
      id = repeatQuestID;

      unsetCompleted(components, id);
      TimeStartComponent(getAddrByID(components, TimeStartCompID)).set(id, block.timestamp);

      // previous objective snapshot are unset during quest completion
      snapshotObjectives(components, questIndex, id, accID);
    } else {
      id = assign(world, components, questIndex, accID);
      setIsRepeatable(components, id);
    }
  }

  function complete(IWorld world, IUintComp components, uint256 questID, uint256 accID) internal {
    setCompleted(components, questID);
    removeSnapshottedObjectives(components, questID);

    uint32 questIndex = IndexQuestComponent(getAddrByID(components, IndexQuestCompID)).get(questID);
    distributeRewards(world, components, questIndex, accID);
  }

  function drop(IUintComp components, uint256 questID) internal {
    LibEntityType.remove(components, questID);
    IDOwnsQuestComponent(getAddrByID(components, OwnQuestCompID)).remove(questID); // TODO: change to holderID
    IndexQuestComponent(getAddrByID(components, IndexQuestCompID)).remove(questID);
    TimeStartComponent(getAddrByID(components, TimeStartCompID)).remove(questID);

    unsetIsRepeatable(components, questID);

    removeSnapshottedObjectives(components, questID);
  }

  function snapshotObjectives(
    IUintComp components,
    uint32 questIndex,
    uint256 questID,
    uint256 accID
  ) internal {
    uint256[] memory objectives = LibQuestRegistry.getObjsByQuestIndex(components, questIndex);

    for (uint256 i; i < objectives.length; i++) {
      string memory logicType = LogicTypeComponent(getAddrByID(components, LogicTypeCompID)).get(
        objectives[i]
      );
      (HANDLER handler, ) = LibConditional.parseLogic(logicType);

      // snapshot objectives values if logic type needs it
      if (handler == HANDLER.INCREASE || handler == HANDLER.DECREASE)
        snapshotObjective(components, questID, objectives[i], logicType, accID);
    }
  }

  // snapshots current state of an account for required fields, if needed
  // stores child entities, eg inventory, on the quest entity itself
  function snapshotObjective(
    IUintComp components,
    uint256 questID,
    uint256 conditionID,
    string memory logicType,
    uint256 accID
  ) internal returns (uint256) {
    string memory _type = TypeComponent(getAddrByID(components, TypeCompID)).get(conditionID);
    uint32 index = IndexComponent(getAddrByID(components, IndexCompID)).safeGet(conditionID);
    uint256 amount = LibData.get(components, accID, index, _type);

    // copy an objective
    uint256 id = genObjSnapshotID(questID, logicType, _type, index);
    IDOwnsQuestComponent(getAddrByID(components, OwnQuestCompID)).set(id, questID); // TODO: change to anchorID (world3)
    ValueComponent(getAddrByID(components, ValueCompID)).set(id, amount);
    return id;
  }

  function removeSnapshottedObjectives(IUintComp components, uint256 questID) internal {
    uint256[] memory objectives = querySnapshottedObjectives(components, questID);

    IDOwnsQuestComponent(getAddrByID(components, OwnQuestCompID)).remove(objectives);
    ValueComponent(getAddrByID(components, ValueCompID)).remove(objectives);
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
    uint256 timeStart = TimeStartComponent(getAddrByID(components, TimeStartCompID)).get(
      repeatQuestID
    );
    uint256 regID = LibQuestRegistry.getByIndex(components, questIndex);
    uint256 duration = TimeComponent(getAddrByID(components, TimeCompID)).get(regID);
    return block.timestamp > timeStart + duration;
  }

  function checkRequirements(
    IUintComp components,
    uint32 questIndex,
    uint256 accID
  ) internal view returns (bool) {
    uint256[] memory requirements = LibQuestRegistry.getReqsByQuestIndex(components, questIndex);
    return LibConditional.check(components, requirements, accID);
  }

  function checkObjectives(
    IUintComp components,
    uint256 questID,
    uint256 accID
  ) internal view returns (bool result) {
    uint32 questIndex = IndexQuestComponent(getAddrByID(components, IndexQuestCompID)).get(questID);
    uint256[] memory objIDs = LibQuestRegistry.getObjsByQuestIndex(components, questIndex);
    Condition[] memory objs = LibConditional.get(components, objIDs);

    for (uint256 i; i < objs.length; i++) {
      uint256 targetID = LibConditional.parseTargetShape(components, accID, objs[i].for_);
      (HANDLER handler, LOGIC operator) = LibConditional.parseLogic(objs[i]);

      if (handler == HANDLER.CURRENT) {
        result = LibConditional._checkCurr(components, targetID, objs[i], operator);
      } else if (handler == HANDLER.INCREASE) {
        result = checkIncrease(components, targetID, questID, objIDs[i], objs[i], operator);
      } else if (handler == HANDLER.DECREASE) {
        result = checkDecrease(components, targetID, questID, objIDs[i], objs[i], operator);
      } else if (handler == HANDLER.BOOLEAN) {
        result = LibConditional._checkBool(components, targetID, objs[i], operator);
      } else {
        revert("Unknown objective handler");
      }

      if (!result) return false;
    }

    return true;
  }

  function distributeRewards(
    IWorld world,
    IUintComp components,
    uint32 questIndex,
    uint256 accID
  ) internal {
    uint256[] memory rewards = LibQuestRegistry.getRwdsByQuestIndex(components, questIndex);
    LibAllo.distribute(world, components, rewards, accID);
  }

  function checkIncrease(
    IUintComp components,
    uint256 accID,
    uint256 questID,
    uint256 conditionID,
    Condition memory data,
    LOGIC logic
  ) internal view returns (bool) {
    uint256 currValue = LibData.get(components, accID, data.index, data.type_);
    uint256 prevValue = getSnapshotValue(components, questID, data);

    // overall value decreased - condition not be met, will overflow if checked
    if (prevValue > currValue) return false;

    return LibConditional._checkLogicOperator(currValue - prevValue, data.value, logic);
  }

  function checkDecrease(
    IUintComp components,
    uint256 accID,
    uint256 questID,
    uint256 conditionID,
    Condition memory data,
    LOGIC logic
  ) internal view returns (bool) {
    uint256 currValue = LibData.get(components, accID, data.index, data.type_);
    uint256 prevValue = getSnapshotValue(components, questID, data);

    // overall value increased - condition not be met, will overflow if checked
    if (currValue > prevValue) return false;

    return LibConditional._checkLogicOperator(prevValue - currValue, data.value, logic);
  }

  // checks if an account has completed a quest
  function checkAccQuestComplete(
    IUintComp components,
    uint32 questIndex,
    uint256 accID
  ) internal view returns (bool) {
    uint256 id = getAccQuestIndex(components, accID, questIndex);
    return id != 0 ? isCompleted(components, id) : false;
  }

  /////////////////
  // CHECKERS

  function verifyNotCompleted(IUintComp components, uint256 id) public view {
    if (isCompleted(components, id)) revert("quest alr completed");
  }

  function verifyIsQuest(IUintComp components, uint256 id) public view {
    if (!LibEntityType.isShape(components, id, "QUEST")) revert("not a quest");
  }

  function verifyOwner(IUintComp components, uint256 questID, uint256 accID) public view {
    if (IDOwnsQuestComponent(getAddrByID(components, OwnQuestCompID)).get(questID) != accID)
      revert("not ur quest");
  }

  function verifyObjectives(IUintComp components, uint256 questID, uint256 accID) public {
    if (!checkObjectives(components, questID, accID)) revert("quest objs not met");
  }

  function verifyRequirements(IUintComp components, uint32 index, uint256 accID) public view {
    if (!checkRequirements(components, index, accID)) revert("reqs not met");
  }

  function verifyRepeatable(IUintComp components, uint32 index, uint256 questID) public view {
    if (!checkRepeat(components, index, questID)) revert("repeat cons not met");
  }

  function isRepeatable(IUintComp components, uint256 id) internal view returns (bool) {
    return IsRepeatableComponent(getAddrByID(components, IsRepeatableCompID)).has(id);
  }

  function isCompleted(IUintComp components, uint256 id) internal view returns (bool) {
    return IsCompleteComponent(getAddrByID(components, IsCompleteCompID)).has(id);
  }

  /////////////////
  // SETTERS

  function setCompleted(IUintComp components, uint256 id) internal {
    IsCompleteComponent(getAddrByID(components, IsCompleteCompID)).set(id);
  }

  function setIsRepeatable(IUintComp components, uint256 id) internal {
    IsRepeatableComponent(getAddrByID(components, IsRepeatableCompID)).set(id);
  }

  function unsetCompleted(IUintComp components, uint256 id) internal {
    IsCompleteComponent(getAddrByID(components, IsCompleteCompID)).remove(id);
  }

  function unsetIsRepeatable(IUintComp components, uint256 id) internal {
    IsRepeatableComponent(getAddrByID(components, IsRepeatableCompID)).remove(id);
  }

  /////////////////
  // GETTERS

  function getAccQuestIndex(
    IUintComp components,
    uint256 accID,
    uint32 questIndex
  ) internal view returns (uint256) {
    uint256 id = genQuestID(questIndex, accID);
    return LibEntityType.isShape(components, id, "QUEST") ? id : 0;
  }

  /// @dev if snapshotted value doesnt exist (ie from registry change), returns 0.
  /// may autocomplete inc or render dec uncompletable - drop quest if so
  function getSnapshotValue(
    IUintComp components,
    uint256 questID,
    Condition memory data
  ) internal view returns (uint256) {
    uint256 id = genObjSnapshotID(questID, data.logic, data.type_, data.index);
    return ValueComponent(getAddrByID(components, ValueCompID)).safeGet(id);
  }

  /////////////////
  // QUERIES

  function querySnapshottedObjectives(
    IUintComp components,
    uint256 questID
  ) internal view returns (uint256[] memory) {
    return
      IDOwnsQuestComponent(getAddrByID(components, OwnQuestCompID)).getEntitiesWithValue(questID);
  }

  ////////////////////
  // LOGGING

  function logComplete(IUintComp components, uint256 accID) public {
    LibData.inc(components, accID, 0, "QUEST_COMPLETE", 1);
  }

  function logCompleteRepeatable(IUintComp components, uint256 accID, uint256 questID) public {
    if (isRepeatable(components, questID))
      LibData.inc(components, accID, 0, "QUEST_REPEATABLE_COMPLETE", 1);
  }

  ///////////////////////
  // UTILS

  function genQuestID(uint32 index, uint256 accID) internal pure returns (uint256) {
    // world3: change to 'quest.instance'
    return uint256(keccak256(abi.encodePacked("registry.quest", index, accID)));
  }

  function genObjSnapshotID(
    uint256 questID,
    string memory logicType,
    string memory _type,
    uint32 index
  ) internal pure returns (uint256) {
    return
      uint256(
        keccak256(abi.encodePacked("quest.objective.snapshot", questID, logicType, _type, index))
      );
  }
}
