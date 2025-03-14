// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";

import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { IDAnchorComponent, ID as IDAnchorCompID } from "components/IDAnchorComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IsCompleteComponent, ID as IsCompleteCompID } from "components/IsCompleteComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { SubtypeComponent, ID as SubtypeCompID } from "components/SubtypeComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibFor } from "libraries/utils/LibFor.sol";
import { LibGetter } from "libraries/utils/LibGetter.sol";

import { LibRoom } from "libraries/LibRoom.sol";

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
  uint32 index; // can be empty (0)
  uint256 value; // can be empty (0)
  string for_; // target shape. can be empty ('')
}

/** @notice Library for the Condition entity and generalised combination of boolean checks
 * Basic Condition structure:
 * - TypeComponent (key)
 * - LogicTypeComponent (key)
 * - IndexComponent (key)
 * - ValueComponent (value)
 * - IDAnchorComponent (optional): for reverse mapping
 * - ForComponent (optional): set target shape (ie ROOM, ACCOUNT, KAMI); if original target is KAMI, for=ACCOUNT get kami's owner. empty = no target change
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
  /// @dev overload to set via struct
  function create(IUintComp components, uint256 id, Condition memory details) internal {
    TypeComponent(getAddrByID(components, TypeCompID)).set(id, details.type_);
    LogicTypeComponent(getAddrByID(components, LogicTypeCompID)).set(id, details.logic);

    if (details.index != 0)
      IndexComponent(getAddrByID(components, IndexCompID)).set(id, details.index);
    if (details.value != 0)
      ValueComponent(getAddrByID(components, ValueCompID)).set(id, details.value);
    if (!details.for_.eq("")) LibFor.set(components, id, details.for_);
  }

  /// @notice creates a condition that points to another entity
  /// @dev IDAnchorComponent used for pointing
  function createFor(
    IWorld world,
    IUintComp components,
    Condition memory details,
    uint256 pointerID
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    create(components, id, details);
    IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).set(id, pointerID);
  }

  function remove(IUintComp components, uint256 id) internal {
    TypeComponent(getAddrByID(components, TypeCompID)).remove(id);
    LogicTypeComponent(getAddrByID(components, LogicTypeCompID)).remove(id);
    IndexComponent(getAddrByID(components, IndexCompID)).remove(id);
    ValueComponent(getAddrByID(components, ValueCompID)).remove(id);
    IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).remove(id);
    LibFor.remove(components, id);
  }

  function remove(IUintComp components, uint256[] memory ids) internal {
    TypeComponent(getAddrByID(components, TypeCompID)).remove(ids);
    LogicTypeComponent(getAddrByID(components, LogicTypeCompID)).remove(ids);
    IndexComponent(getAddrByID(components, IndexCompID)).remove(ids);
    ValueComponent(getAddrByID(components, ValueCompID)).remove(ids);
    IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).remove(ids);
    LibFor.remove(components, ids);
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
    targetID = parseTargetShape(components, targetID, data.for_);
    (HANDLER handler, LOGIC logic) = parseLogic(data);
    if (handler == HANDLER.CURRENT) return _checkCurr(components, targetID, data, logic);
    else if (handler == HANDLER.BOOLEAN) return _checkBool(components, targetID, data, logic);
    else revert("Handler not yet implemented");
  }

  /// @notice updates target shape based on For type
  /// @dev can only go from one->one/many->one, not one->many (eg. KAMI->ACCOUNT, but not other way)
  function parseTargetShape(
    IUintComp components,
    uint256 targetID,
    string memory forShape
  ) internal view returns (uint256) {
    if (forShape.eq("")) return targetID; // no change

    if (forShape.eq("ACCOUNT")) {
      return LibGetter.getAccount(components, targetID);
    } else if (forShape.eq("ROOM")) {
      uint32 roomIndex = LibGetter.getRoom(components, targetID);
      return LibRoom.getByIndex(components, roomIndex);
    } else if (forShape.eq("KAMI")) {
      if (LibEntityType.isShape(components, targetID, "KAMI")) return targetID;
      else revert("LibCon: invalid for (exp kami, not kami)");
    } else revert("LibCon: invalid for shape");
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
        type_: TypeComponent(getAddrByID(components, TypeCompID)).get(id),
        logic: LogicTypeComponent(getAddrByID(components, LogicTypeCompID)).get(id),
        index: IndexComponent(getAddrByID(components, IndexCompID)).safeGet(id),
        value: ValueComponent(getAddrByID(components, ValueCompID)).safeGet(id),
        for_: LibFor.get(components, id)
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
        index: indexComp.safeGet(ids[i]),
        value: valueComp.safeGet(ids[i]),
        for_: LibFor.get(components, ids[i])
      });
    }
    return conditions;
  }

  ///////////////////////
  // QUERIES

  function queryFor(IUintComp components, uint256 id) internal view returns (uint256[] memory) {
    return IUintComp(getAddrByID(components, IDAnchorCompID)).getEntitiesWithValue(id);
  }

  function queryFor(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (uint256[] memory) {
    return IUintComp(getAddrByID(components, IDAnchorCompID)).getEntitiesWithValue(ids);
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
      getCompByID(components, IDAnchorCompID),
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
