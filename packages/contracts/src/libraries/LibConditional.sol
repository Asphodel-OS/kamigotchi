// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";

import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { IDParentComponent, ID as IDParentCompID } from "components/IDParentComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IsCompleteComponent, ID as IsCompleteCompID } from "components/IsCompleteComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { SubtypeComponent, ID as SubtypeCompID } from "components/SubtypeComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
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
 * - IndexComponent (key)
 * - ValueComponent (value)
 * - IDParentComponent (optional): for reverse mapping
 * - SubtypeComponent (optional): for additional context
 *
 * This library is designed to provide a base functionality for checks, but can be replaced for per-application logic
 * heavily inspired by Quest condition checks. Does not yet support increase/decrease checks, but can in future
 */
library LibConditional {
  using LibComp for IUintComp;
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
    TypeComponent(getAddrByID(components, TypeCompID)).set(id, type_);
    LogicTypeComponent(getAddrByID(components, LogicTypeCompID)).set(id, logicType);
  }

  /// @notice creates a condition entity owned by another entity
  /// @dev overload to set via struct
  function create(IUintComp components, uint256 id, Condition memory details) internal {
    create(components, id, details.type_, details.logic);

    if (details.index != 0)
      IndexComponent(getAddrByID(components, IndexCompID)).set(id, details.index);
    if (details.value != 0)
      ValueComponent(getAddrByID(components, ValueCompID)).set(id, details.value);
  }

  /// @notice creates a condition that points to another entity
  /// @dev IDParentComponent used for pointing
  function createFor(
    IWorld world,
    IUintComp components,
    Condition memory details,
    uint256 pointerID
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    create(components, id, details);
    IDParentComponent(getAddrByID(components, IDParentCompID)).set(id, pointerID);
  }

  /// @notice adds an optional subtype to a condition
  function addSubtype(IUintComp components, uint256 id, string memory subtype) internal {
    SubtypeComponent(getAddrByID(components, SubtypeCompID)).set(id, subtype);
  }

  function remove(IUintComp components, uint256 id) internal {
    TypeComponent(getAddrByID(components, TypeCompID)).remove(id);
    LogicTypeComponent(getAddrByID(components, LogicTypeCompID)).remove(id);
    IndexComponent(getAddrByID(components, IndexCompID)).remove(id);
    ValueComponent(getAddrByID(components, ValueCompID)).remove(id);
    IDParentComponent(getAddrByID(components, IDParentCompID)).remove(id);
    SubtypeComponent(getAddrByID(components, SubtypeCompID)).remove(id);
  }

  function remove(IUintComp components, uint256[] memory ids) internal {
    TypeComponent(getAddrByID(components, TypeCompID)).remove(ids);
    LogicTypeComponent(getAddrByID(components, LogicTypeCompID)).remove(ids);
    IndexComponent(getAddrByID(components, IndexCompID)).remove(ids);
    ValueComponent(getAddrByID(components, ValueCompID)).remove(ids);
    IDParentComponent(getAddrByID(components, IDParentCompID)).remove(ids);
    SubtypeComponent(getAddrByID(components, SubtypeCompID)).remove(ids);
  }

  ///////////////////////
  // INTERACTIONS

  /// @notice checks a batch of conditions
  function check(
    IUintComp components,
    uint256[] memory conditionIDs,
    uint256 targetID
  ) internal view returns (bool) {
    if (conditionIDs.length == 0) return true;
    Condition[] memory datas = get(components, conditionIDs);

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
    if (handler == HANDLER.CURRENT) return _checkCurr(components, targetID, data, logic);
    else if (handler == HANDLER.BOOLEAN) return _checkBool(components, targetID, data, logic);
    else revert("Handler not yet implemented");
  }

  /// @notice checks for a current value against an account
  function _checkCurr(
    IUintComp components,
    uint256 targetID,
    Condition memory data,
    LOGIC logic
  ) internal view returns (bool) {
    uint256 value = LibGetter.getBal(components, targetID, data.type_, data.index);
    return _checkLogicOperator(value, data.value, logic);
  }

  /// @notice checks for a boolean value against
  function _checkBool(
    IUintComp components,
    uint256 targetID,
    Condition memory data,
    LOGIC logic
  ) internal view returns (bool result) {
    result = LibGetter.getBool(components, targetID, data.type_, data.index, data.value);
    if (logic == LOGIC.NOT) result = !result;
    else if (logic != LOGIC.IS) revert("Unknown bool logic operator");
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

  function get(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (Condition[] memory) {
    TypeComponent typeComp = TypeComponent(getAddrByID(components, TypeCompID));
    LogicTypeComponent logicComp = LogicTypeComponent(getAddrByID(components, LogicTypeCompID));
    IndexComponent indexComp = IndexComponent(getAddrByID(components, IndexCompID));
    ValueComponent valueComp = ValueComponent(getAddrByID(components, ValueCompID));

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
    ValueComponent comp = ValueComponent(getAddrByID(components, ValueCompID));
    return comp.has(id) ? comp.get(id) : 0;
  }

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    IndexComponent comp = IndexComponent(getAddrByID(components, IndexCompID));
    return comp.has(id) ? comp.get(id) : 0;
  }

  function getLogic(IUintComp components, uint256 id) internal view returns (string memory) {
    return LogicTypeComponent(getAddrByID(components, LogicTypeCompID)).get(id);
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddrByID(components, TypeCompID)).get(id);
  }

  ///////////////////////
  // QUERIES

  function queryFor(IUintComp components, uint256 id) internal view returns (uint256[] memory) {
    return IUintComp(getAddrByID(components, IDParentCompID)).getEntitiesWithValue(id);
  }

  function queryFor(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (uint256[] memory) {
    return IUintComp(getAddrByID(components, IDParentCompID)).getEntitiesWithValue(ids);
  }

  /// @notice queries for conditions with subtype
  function queryFor(
    IUintComp components,
    uint256 id,
    string memory subtype
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(
      QueryType.HasValue,
      getCompByID(components, IDParentCompID),
      abi.encode(id)
    );
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getCompByID(components, SubtypeCompID),
      abi.encode(subtype)
    );
    return LibQuery.query(fragments);
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
    else revert("Unknown condition handler");

    if (logicType.endsWith("MIN")) operator = LOGIC.MIN;
    else if (logicType.endsWith("MAX")) operator = LOGIC.MAX;
    else if (logicType.endsWith("EQUAL")) operator = LOGIC.EQUAL;
    else if (logicType.endsWith("IS")) operator = LOGIC.IS;
    else if (logicType.endsWith("NOT")) operator = LOGIC.NOT;
    else revert("Unknown condition operator");

    return (handler, operator);
  }

  function _checkLogicOperator(uint256 a, uint256 b, LOGIC logic) internal pure returns (bool) {
    if (logic == LOGIC.MIN) return a >= b;
    else if (logic == LOGIC.MAX) return a <= b;
    else if (logic == LOGIC.EQUAL) return a == b;
    else revert("Unknown logic operator");
  }
}
