// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { LibString } from "solady/utils/LibString.sol";

import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IsCompleteComponent, ID as IsCompleteCompID } from "components/IsCompleteComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibData } from "libraries/LibData.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibFactions } from "libraries/LibFactions.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibQuests } from "libraries/LibQuests.sol";
import { LibRoom } from "libraries/LibRoom.sol";
import { LibSkill } from "libraries/LibSkill.sol";

enum LOGIC {
  MIN,
  MAX,
  EQUAL,
  IS,
  NOT
}

enum HANDLER {
  CURRENT,
  INCREASE,
  DECREASE,
  BOOLEAN
}

struct Condition {
  string type_;
  string logic;
  uint32 index;
  uint256 value;
}

/** @notice Library for the Condition entity and generalised combination of boolean checks
 * Basic Condition structure:
 * - TypeComponent (key)
 * - LogicTypeComponent (key)
 * - IndexComponent (optional key)
 * - ValueComponent (value)
 *
 * This library is designed to provide a base functionality for checks, but can be replaced for per-application logic
 * heavily inspired by Quest condition checks. Does not yet support increase/decrease checks, but can in future
 */
library LibBoolean {
  using LibString for string;

  ///////////////////////
  // ENTITY

  /// @notice creates a condition entity owned by another entity
  /** @dev
   *   - bare minimum condition entity.
   *   - other libs are expected to add their own identifying features. Suggested: HolderID
   */
  function create(
    IUintComp components,
    uint256 id,
    string memory type_,
    string memory logicType
  ) internal {
    setType(components, id, type_);
    setLogicType(components, id, logicType);
  }

  /// @notice creates a condition entity owned by another entity
  /// @dev overload to set via struct
  function create(IUintComp components, uint256 id, Condition memory details) internal {
    create(components, id, details.type_, details.logic);

    if (details.index != 0) setIndex(components, id, details.index);
    if (details.value != 0) setBalance(components, id, details.value);
  }

  function remove(IUintComp components, uint256 id) internal {
    TypeComponent(getAddressById(components, TypeCompID)).remove(id);
    LogicTypeComponent(getAddressById(components, LogicTypeCompID)).remove(id);
  }

  ///////////////////////
  // INTERACTIONS

  /// @notice checks a batch of conditions
  function checkConditions(
    IUintComp components,
    uint256[] memory conditionIDs,
    uint256 targetID
  ) internal view returns (bool) {
    if (conditionIDs.length == 0) return true;
    IndexComponent indexComp = IndexComponent(getAddressById(components, IndexCompID));
    ValueComponent balComp = ValueComponent(getAddressById(components, ValueCompID));
    TypeComponent typeComp = TypeComponent(getAddressById(components, TypeCompID));
    LogicTypeComponent logicTypeComp = LogicTypeComponent(
      getAddressById(components, LogicTypeCompID)
    );

    for (uint256 i = 0; i < conditionIDs.length; i++) {
      uint32 index = indexComp.has(conditionIDs[i]) ? indexComp.get(conditionIDs[i]) : 0;
      uint256 value = balComp.has(conditionIDs[i]) ? balComp.get(conditionIDs[i]) : 0;
      string memory type_ = typeComp.get(conditionIDs[i]);
      string memory logicType = logicTypeComp.get(conditionIDs[i]);

      if (!check(components, targetID, index, value, type_, logicType)) return false;
    }
    return true;
  }

  /// @notice checks a condition
  function check(
    IUintComp components,
    uint256 targetID,
    uint32 index,
    uint256 expected,
    string memory type_,
    string memory logicType
  ) internal view returns (bool) {
    (HANDLER handler, LOGIC logic) = parseLogic(logicType);
    if (handler == HANDLER.CURRENT)
      return checkCurr(components, targetID, index, expected, type_, logic);
    else if (handler == HANDLER.BOOLEAN)
      return checkBool(components, targetID, index, expected, type_, logic);
    else require(false, "Handler not yet implemented");
  }

  /// @notice checks for a current value against an account
  function checkCurr(
    IUintComp components,
    uint256 targetID,
    uint32 index,
    uint256 expected,
    string memory _type,
    LOGIC logic
  ) internal view returns (bool) {
    uint256 value = getBalanceOf(components, targetID, _type, index);
    return _checkLogicOperator(value, expected, logic);
  }

  /// @notice checks for a boolean value against
  function checkBool(
    IUintComp components,
    uint256 targetID,
    uint32 index,
    uint256 expected,
    string memory _type,
    LOGIC logic
  ) internal view returns (bool result) {
    if (_type.eq("COMPLETE_COMP")) {
      // check if entity has isCompleteComp, with expectedValue acting as entityID
      result = IsCompleteComponent(getAddressById(components, IsCompleteCompID)).has(expected);
    } else if (_type.eq("QUEST")) {
      result = LibQuests.checkAccQuestComplete(components, index, targetID);
    } else if (_type.eq("ROOM")) {
      result = LibRoom.getIndex(components, targetID) == index;
    } else {
      require(false, "Unknown bool condition type");
    }

    if (logic == LOGIC.NOT) result = !result;
    else require(logic == LOGIC.IS, "Unknown bool logic operator");
  }

  //////////////
  // SETTERS
  function setBalance(IUintComp components, uint256 id, uint256 value) internal {
    ValueComponent(getAddressById(components, ValueCompID)).set(id, value);
  }

  function setHolder(IUintComp components, uint256 id, uint256 holderID) internal {
    IdHolderComponent(getAddressById(components, IdHolderCompID)).set(id, holderID);
  }

  function setLogicType(IUintComp components, uint256 id, string memory logicType) internal {
    LogicTypeComponent(getAddressById(components, LogicTypeCompID)).set(id, logicType);
  }

  function setIndex(IUintComp components, uint256 id, uint32 index) internal {
    IndexComponent(getAddressById(components, IndexCompID)).set(id, index);
  }

  function setType(IUintComp components, uint256 id, string memory type_) internal {
    TypeComponent(getAddressById(components, TypeCompID)).set(id, type_);
  }

  function unsetAll(IUintComp components, uint256 id) internal {
    TypeComponent(getAddressById(components, TypeCompID)).remove(id);
    LogicTypeComponent(getAddressById(components, LogicTypeCompID)).remove(id);
    unsetBalance(components, id);
    unsetIndex(components, id);
  }

  function unsetBalance(IUintComp components, uint256 id) internal {
    ValueComponent comp = ValueComponent(getAddressById(components, ValueCompID));
    if (comp.has(id)) comp.remove(id);
  }

  function unsetIndex(IUintComp components, uint256 id) internal {
    IndexComponent comp = IndexComponent(getAddressById(components, IndexCompID));
    if (comp.has(id)) comp.remove(id);
  }

  ///////////////////////
  // GETTERS

  // get the balance of X (type+index) of an account
  function getBalanceOf(
    IUintComp components,
    uint256 id,
    string memory _type,
    uint32 index
  ) public view returns (uint256 balance) {
    if (_type.eq("ITEM")) {
      balance = LibInventory.getBalanceOf(components, id, index);
    } else if (_type.eq("LEVEL")) {
      balance = LibExperience.getLevel(components, id);
    } else if (_type.eq("KAMI")) {
      balance = LibAccount.getPetsOwned(components, id).length;
    } else if (_type.eq("KAMI_LEVEL_HIGHEST")) {
      balance = getTopLevel(components, LibAccount.getPetsOwned(components, id));
    } else if (_type.eq("SKILL")) {
      balance = LibSkill.getPointsOf(components, id, index);
    } else if (_type.eq("REPUTATION")) {
      balance = LibFactions.getRep(components, id, index);
    } else {
      balance = LibData.get(components, id, index, _type);
    }
  }

  function getTopLevel(IUintComp components, uint256[] memory ids) internal view returns (uint256) {
    uint256 highestLevel = 1;
    LevelComponent levelComp = LevelComponent(getAddressById(components, LevelCompID));
    for (uint256 i = 0; i < ids.length; i++) {
      uint256 level = levelComp.get(ids[i]);
      if (level > highestLevel) highestLevel = level;
    }
    return highestLevel;
  }

  function getBalance(IUintComp components, uint256 id) internal view returns (uint256) {
    ValueComponent comp = ValueComponent(getAddressById(components, ValueCompID));
    return comp.has(id) ? comp.get(id) : 0;
  }

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    IndexComponent comp = IndexComponent(getAddressById(components, IndexCompID));
    return comp.has(id) ? comp.get(id) : 0;
  }

  function getLogic(IUintComp components, uint256 id) internal view returns (string memory) {
    return LogicTypeComponent(getAddressById(components, LogicTypeCompID)).get(id);
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).get(id);
  }

  ///////////////////////
  // UTILS

  /// @notice determines objective logic handler and operator
  /// @dev gets the logic from a formatted string - "[HANDLER]_[LOGIC]"
  function parseLogic(string memory logicType) internal pure returns (HANDLER, LOGIC) {
    HANDLER handler;
    LOGIC operator;

    if (logicType.startsWith("CURR")) handler = HANDLER.CURRENT;
    else if (logicType.startsWith("INC")) handler = HANDLER.INCREASE;
    else if (logicType.startsWith("DEC")) handler = HANDLER.DECREASE;
    else if (logicType.startsWith("BOOL")) handler = HANDLER.BOOLEAN;
    else require(false, "Unknown condition handler");

    if (logicType.endsWith("MIN")) operator = LOGIC.MIN;
    else if (logicType.endsWith("MAX")) operator = LOGIC.MAX;
    else if (logicType.endsWith("EQUAL")) operator = LOGIC.EQUAL;
    else if (logicType.endsWith("IS")) operator = LOGIC.IS;
    else if (logicType.endsWith("NOT")) operator = LOGIC.NOT;
    else require(false, "Unknown condition operator");

    return (handler, operator);
  }

  function _checkLogicOperator(uint256 a, uint256 b, LOGIC logic) internal pure returns (bool) {
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
}
