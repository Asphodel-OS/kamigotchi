// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IComponent as IComp } from "solecs/interfaces/IComponent.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IdAccountComponent, ID as IdAccountCompID } from "components/IdAccountComponent.sol";
import { IdHolderComponent, ID as HolderCompID } from "components/IdHolderComponent.sol";
import { IsObjectiveComponent, ID as IsObjectiveCompID } from "components/IsObjectiveComponent.sol";
import { IsRewardComponent, ID as IsRewardCompID } from "components/IsRewardComponent.sol";
import { IsQuestComponent, ID as IsQuestCompID } from "components/IsQuestComponent.sol";
import { IsCompleteComponent, ID as CompletionCompID } from "components/IsCompleteComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IndexQuestComponent, ID as IndexQuestCompID } from "components/IndexQuestComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibCoin } from "libraries/LibCoin.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibRegistryQuests } from "libraries/LibRegistryQuests.sol";
import { LibString } from "solady/utils/LibString.sol";

enum LOGIC {
  MIN,
  MAX,
  EQUAL
}

enum HANDLER {
  CURRENT,
  INCREASE,
  DECREASE
}

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
      (HANDLER handler, ) = parseObjectiveLogic(logicType);
      if (handler == HANDLER.INCREASE || handler == HANDLER.DECREASE) {
        snapshotObjective(world, components, id, objectives[i], accountID);
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
  function snapshotObjective(
    IWorld world,
    IUintComp components,
    uint256 questID,
    uint256 conditionID,
    uint256 accountID
  ) internal returns (uint256) {
    string memory _type = getType(components, conditionID);
    string memory logicType = getLogicType(components, conditionID);
    uint256 itemIndex = getIndex(components, conditionID);

    uint256 amount = getAccBal(components, accountID, itemIndex, _type);

    // copy an objective
    uint256 id = world.getUniqueEntityId();
    setIsObjective(components, id);
    setLogicType(components, id, logicType);
    setType(components, id, _type);
    setHolderId(components, id, questID);
    if (hasIndex(components, conditionID)) {
      setIndex(components, id, getIndex(components, conditionID));
    }
    setValue(components, id, amount);
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
    uint256 accountID
  ) internal returns (bool) {
    uint256 questIndex = getQuestIndex(components, questID);

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
        result = checkCurrent(components, requirements[i], accountID, LOGIC.EQUAL);
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
      uint256 itemIndex = getIndex(components, rewards[i]);
      uint256 amount = getValue(components, rewards[i]);

      incAccBal(world, components, accountID, amount, itemIndex, _type);
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
    uint256 itemIndex = getIndex(components, conditionID);
    uint256 expected = getValue(components, conditionID);

    // check account
    uint256 accountValue = getAccBal(components, accountID, itemIndex, _type);

    return checkLogicOperator(accountValue, expected, logic);
  }

  function checkUseCurrent(
    IUintComp components,
    uint256 conditionID,
    uint256 accountID,
    LOGIC logic
  ) internal returns (bool) {
    // details of condition
    string memory _type = getType(components, conditionID);
    uint256 itemIndex = getIndex(components, conditionID);
    uint256 expected = getValue(components, conditionID);

    // check account
    uint256 accountValue = getAccBal(components, accountID, itemIndex, _type);

    // TODO: implement use logic

    return checkLogicOperator(accountValue, expected, logic);
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
    uint256 itemIndex = getIndex(components, conditionID);

    uint256 delta = getValue(components, conditionID);
    uint256 snapshotID = getSnapshotObjective(components, questID, conditionID);
    uint256 prevValue = getValue(components, snapshotID);

    uint256 currValue = getAccBal(components, accountID, itemIndex, _type);

    // overall value decreased - condition not be met, will overflow if checked
    if (prevValue > currValue) {
      return false;
    }

    return checkLogicOperator(currValue - prevValue, delta, logic);
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
    uint256 itemIndex = getIndex(components, conditionID);

    uint256 delta = getValue(components, conditionID);
    uint256 snapshotID = getSnapshotObjective(components, questID, conditionID);
    uint256 prevValue = getValue(components, snapshotID);

    uint256 currValue = getAccBal(components, accountID, itemIndex, _type);

    // overall value increased - condition not be met, will overflow if checked
    if (currValue > prevValue) {
      return false;
    }

    return checkLogicOperator(prevValue - currValue, delta, logic);
  }

  /////////////////
  // CHECKERS

  function hasIndex(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexComponent(getAddressById(components, IndexCompID)).has(id);
  }

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

  function isCompleted(IUintComp components, uint256 id) internal view returns (bool) {
    return IsCompleteComponent(getAddressById(components, CompletionCompID)).has(id);
  }

  function isTypeInventory(string memory _type) internal view returns (bool) {
    return (LibString.eq(_type, "EQUIP") ||
      LibString.eq(_type, "FOOD") ||
      LibString.eq(_type, "REVIVE") ||
      LibString.eq(_type, "MOD"));
  }

  function checkLogicOperator(uint256 a, uint256 b, LOGIC logic) internal pure returns (bool) {
    if (logic == LOGIC.MIN) {
      return a >= b;
    } else if (logic == LOGIC.MAX) {
      return a <= b;
    } else if (logic == LOGIC.EQUAL) {
      return a == b;
    } else {
      require(false, "Unknown logic operator");
    }
  }

  /////////////////
  // SETTERS

  function setAccountId(IUintComp components, uint256 id, uint256 accountID) internal {
    IdAccountComponent(getAddressById(components, IdAccountCompID)).set(id, accountID);
  }

  function setCompleted(IUintComp components, uint256 id) internal {
    IsCompleteComponent(getAddressById(components, CompletionCompID)).set(id);
  }

  function setHolderId(IUintComp components, uint256 id, uint256 holderID) internal {
    IdHolderComponent(getAddressById(components, HolderCompID)).set(id, holderID);
  }

  function setIsQuest(IUintComp components, uint256 id) internal {
    IsQuestComponent(getAddressById(components, IsQuestCompID)).set(id);
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

  function setTimeStart(IUintComp components, uint256 id, uint256 time) internal {
    TimeStartComponent(getAddressById(components, TimeStartCompID)).set(id, time);
  }

  function setType(IUintComp components, uint256 id, string memory type_) internal {
    TypeComponent(getAddressById(components, TypeCompID)).set(id, type_);
  }

  function setValue(IUintComp components, uint256 id, uint256 value) internal {
    ValueComponent(getAddressById(components, ValueCompID)).set(id, value);
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

  function getIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    if (hasIndex(components, id)) {
      return IndexComponent(getAddressById(components, IndexCompID)).getValue(id);
    } else {
      return 0;
    }
  }

  function getValue(IUintComp components, uint256 id) internal view returns (uint256) {
    return ValueComponent(getAddressById(components, ValueCompID)).getValue(id);
  }

  ////////////////
  // UTILITIES

  // determins objective logic handler and operator
  function parseObjectiveLogic(string memory _type) internal view returns (HANDLER, LOGIC) {
    if (LibString.eq(_type, "AT")) {
      return (HANDLER.CURRENT, LOGIC.EQUAL);
    } else if (LibString.eq(_type, "BUY")) {
      return (HANDLER.INCREASE, LOGIC.MIN);
    } else if (LibString.eq(_type, "HAVE")) {
      return (HANDLER.CURRENT, LOGIC.MIN);
    } else if (LibString.eq(_type, "GATHER")) {
      return (HANDLER.INCREASE, LOGIC.MIN);
    } else if (LibString.eq(_type, "MINT")) {
      return (HANDLER.INCREASE, LOGIC.MIN);
    } else if (LibString.eq(_type, "USE")) {
      return (HANDLER.DECREASE, LOGIC.MIN);
    } else {
      require(false, "Unknown condition logic type");
    }
  }

  function getAccBal(
    IUintComp components,
    uint256 id,
    uint256 itemIndex,
    string memory _type
  ) internal view returns (uint256) {
    if (isTypeInventory(_type)) {
      uint256 invID = LibInventory.get(components, id, itemIndex);
      if (invID == 0) return 0;
      else return LibInventory.getBalance(components, invID);
    } else if (LibString.eq(_type, "COIN")) {
      return LibCoin.get(components, id);
    } else {
      require(false, "Unknown type");
    }
  }

  function incAccBal(
    IWorld world,
    IUintComp components,
    uint256 targetID,
    uint256 amount,
    uint256 itemIndex,
    string memory _type
  ) internal {
    if (isTypeInventory(_type)) {
      uint256 invID = LibInventory.get(components, targetID, itemIndex);
      if (invID == 0) {
        invID = LibInventory.create(world, components, targetID, itemIndex);
      }
      LibInventory.inc(components, invID, amount);
    } else if (LibString.eq(_type, "COIN")) {
      LibCoin.inc(components, targetID, amount);
    } else {
      require(false, "Unknown type");
    }
  }

  function getSnapshotObjective(
    IUintComp components,
    uint256 questID,
    uint256 conditionID
  ) internal view returns (uint256) {
    bool hasIndex = hasIndex(components, conditionID);

    QueryFragment[] memory fragments = new QueryFragment[](hasIndex ? 5 : 4);
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
      getComponentById(components, TypeCompID),
      abi.encode(getType(components, conditionID))
    );
    fragments[3] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, LogicTypeCompID),
      abi.encode(getLogicType(components, conditionID))
    );
    if (hasIndex) {
      fragments[4] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IndexCompID),
        abi.encode(getIndex(components, conditionID))
      );
    }

    uint256[] memory results = LibQuery.query(fragments);
    return results[0];
  }
}
