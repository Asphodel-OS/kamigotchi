// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";

import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { IDPointerComponent, ID as IDPointerCompID } from "components/IDPointerComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IsCompleteComponent, ID as IsCompleteCompID } from "components/IsCompleteComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

import { LibGetter } from "libraries/utils/LibGetter.sol";

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
library LibConditional {
  using LibString for string;

  ///////////////////////
  // SHAPES

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
    TypeComponent(getAddressById(components, TypeCompID)).set(id, type_);
    LogicTypeComponent(getAddressById(components, LogicTypeCompID)).set(id, logicType);
  }

  /// @notice creates a condition entity owned by another entity
  /// @dev overload to set via struct
  function create(IUintComp components, uint256 id, Condition memory details) internal {
    create(components, id, details.type_, details.logic);

    if (details.index != 0)
      IndexComponent(getAddressById(components, IndexCompID)).set(id, details.index);
    if (details.value != 0)
      ValueComponent(getAddressById(components, ValueCompID)).set(id, details.value);
  }

  /// @notice creates a condition that points to another entity
  /// @dev IDPointerComponent used for pointing
  function createFor(
    IWorld world,
    IUintComp components,
    Condition memory details,
    uint256 pointerID
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    create(components, id, details);
    IDPointerComponent(getAddressById(components, IDPointerCompID)).set(id, pointerID);
  }

  function remove(IUintComp components, uint256 id) internal {
    TypeComponent(getAddressById(components, TypeCompID)).remove(id);
    LogicTypeComponent(getAddressById(components, LogicTypeCompID)).remove(id);
    IndexComponent(getAddressById(components, IndexCompID)).remove(id);
    ValueComponent(getAddressById(components, ValueCompID)).remove(id);
    IDPointerComponent(getAddressById(components, IDPointerCompID)).remove(id);
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
    Condition[] memory datas = getBatch(components, conditionIDs);

    for (uint256 i = 0; i < conditionIDs.length; i++) {
      if (!check(components, targetID, datas[i])) return false;
    }
    return true;
  }

  /// @notice checks a condition
  function check(
    IUintComp components,
    uint256 targetID,
    Condition memory data
  ) internal view returns (bool) {
    (HANDLER handler, LOGIC logic) = parseLogic(data);
    if (handler == HANDLER.CURRENT) return checkCurr(components, targetID, data, logic);
    else if (handler == HANDLER.BOOLEAN) return checkBool(components, targetID, data, logic);
    else require(false, "Handler not yet implemented");
  }

  /// @notice checks for a current value against an account
  function checkCurr(
    IUintComp components,
    uint256 targetID,
    Condition memory data,
    LOGIC logic
  ) internal view returns (bool) {
    uint256 value = LibGetter.getBalanceOf(components, targetID, data.type_, data.index);
    return _checkLogicOperator(value, data.value, logic);
  }

  /// @notice checks for a boolean value against
  function checkBool(
    IUintComp components,
    uint256 targetID,
    Condition memory data,
    LOGIC logic
  ) internal view returns (bool result) {
    result = LibGetter.getBool(components, targetID, data.type_, data.index, data.value);
    if (logic == LOGIC.NOT) result = !result;
    else require(logic == LOGIC.IS, "Unknown bool logic operator");
  }

  ///////////////////////
  // GETTERS

  function get(IUintComp components, uint256 id) internal view returns (Condition memory) {
    return
      Condition({
        type_: getType(components, id),
        logic: getLogic(components, id),
        index: getIndex(components, id),
        value: getBalance(components, id)
      });
  }

  function getBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (Condition[] memory) {
    TypeComponent typeComp = TypeComponent(getAddressById(components, TypeCompID));
    LogicTypeComponent logicComp = LogicTypeComponent(getAddressById(components, LogicTypeCompID));
    IndexComponent indexComp = IndexComponent(getAddressById(components, IndexCompID));
    ValueComponent valueComp = ValueComponent(getAddressById(components, ValueCompID));

    Condition[] memory conditions = new Condition[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      conditions[i] = Condition({
        type_: typeComp.get(ids[i]),
        logic: logicComp.get(ids[i]),
        index: indexComp.has(ids[i]) ? indexComp.get(ids[i]) : 0,
        value: valueComp.has(ids[i]) ? valueComp.get(ids[i]) : 0
      });
    }
    return conditions;
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
  // QUERIES

  function queryFor(IUintComp components, uint256 id) internal view returns (uint256[] memory) {
    return IDPointerComponent(getAddressById(components, IDPointerCompID)).getEntitiesWithValue(id);
  }

  ///////////////////////
  // UTILS

  function parseLogic(Condition memory data) internal pure returns (HANDLER, LOGIC) {
    return parseLogic(data.logic);
  }

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
