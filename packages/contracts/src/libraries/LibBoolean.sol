// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { LibString } from "solady/utils/LibString.sol";

import { ForComponent, ID as ForCompID } from "components/ForComponent.sol";
import { IdAccountComponent, ID as IdAccountCompID } from "components/IdAccountComponent.sol";
import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IsConditionComponent, ID as IsConditionCompID } from "components/IsConditionComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";

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

/** @notice Library for the Condition entity and generalised combination of boolean checks
 * Basic Condition structure:
 * - IsCondition
 * - IdHolderComponent
 * - TypeComponent (key)
 * - IndexComponent (optional key)
 * - ValueComponent (value)
 *
 * This library is designed to provide a base functionality for checks, but can be replaced for per-application logic
 * heavily inspired by Quest condition checks. Does not yet support increase/decrease checks, but can in future
 */
library LibBoolean {
  ///////////////////////
  // ENTITY

  /// @notice creates a condition entity owned by another entity
  /** @dev
   *   - bare minimum condition entity.
   *   - other libs are expected to add their own identifying features. Suggested: HolderID
   */
  function create(
    IWorld world,
    IUintComp components,
    string memory type_,
    string memory logicType
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIsCondition(components, id);
    setType(components, id, type_);
    setLogicType(components, id, logicType);
    return id;
  }

  ///////////////////////
  // INTERACTIONS

  /// @notice checks a batch of conditions
  function checkConditions(
    IUintComp components,
    uint256[] memory conditionIDs,
    uint256 accountID
  ) internal view returns (bool) {
    IndexComponent indexComp = IndexComponent(getAddressById(components, IndexCompID));
    ValueComponent valueComp = ValueComponent(getAddressById(components, ValueCompID));
    TypeComponent typeComp = TypeComponent(getAddressById(components, TypeCompID));
    LogicTypeComponent logicTypeComp = LogicTypeComponent(
      getAddressById(components, LogicTypeCompID)
    );
    ForComponent forComp = ForComponent(getAddressById(components, ForCompID));

    for (uint256 i = 0; i < conditionIDs.length; i++) {
      // uint256 targetID = accountID; // placeholder, can change in future
      // uint256 forID = forComp.has(conditionIDs[i]) ? forComp.getValue(conditionIDs[i]) : 0;
      uint256 index = indexComp.has(conditionIDs[i]) ? indexComp.getValue(conditionIDs[i]) : 0;
      uint256 value = valueComp.has(conditionIDs[i]) ? valueComp.getValue(conditionIDs[i]) : 0;
      string memory type_ = typeComp.getValue(conditionIDs[i]);
      string memory logicType = logicTypeComp.getValue(conditionIDs[i]);

      if (
        !check(
          components,
          accountID, // targetID,
          index,
          value,
          0, // forID,
          type_,
          logicType
        )
      ) return false;
    }
    return true;
  }

  /// @notice checks a condition
  function check(
    IUintComp components,
    uint256 targetID,
    uint256 index,
    uint256 expected,
    uint256 forEntity, // ForComp, used to differenciate entities. defaults to Account
    string memory logicType,
    string memory type_
  ) internal view returns (bool) {
    (HANDLER handler, LOGIC logic) = _parseLogic(logicType);
    if (handler == HANDLER.CURRENT)
      return checkCurr(components, targetID, index, expected, forEntity, type_, logic);
    else require(false, "Handler not yet implemented");
  }

  /// @notice implements a check against an account
  function checkCurr(
    IUintComp components,
    uint256 targetID,
    uint256 index,
    uint256 expected,
    uint256 forEntity, // ForComp, used to differenciate entities. defaults to Account
    string memory _type,
    LOGIC logic
  ) internal view returns (bool) {
    uint256 value;

    // only works for account rn. implemented like this for future expansion
    if (forEntity == 0 || forEntity == IdAccountCompID)
      value = LibAccount.getBalanceOf(components, targetID, _type, index);
    // possible future use: checks based on guilds, or other world values
    /* else if (forEntity == IdGuildCompID) {
      uint256 guildID = LibAccount.getGuild(components, targetID);
      value = LibGuild.getBalanceOf(components, guildID, _type, index);
    } */

    return LibBoolean._checkLogicOperator(value, expected, logic);
  }

  //////////////
  // SETTERS

  function setIsCondition(IUintComp components, uint256 id) internal {
    IsConditionComponent(getAddressById(components, IsConditionCompID)).set(id);
  }

  function setHolder(IUintComp components, uint256 id, uint256 holderID) internal {
    IdHolderComponent(getAddressById(components, IdHolderCompID)).set(id, holderID);
  }

  function setLogicType(IUintComp components, uint256 id, string memory logicType) internal {
    LogicTypeComponent(getAddressById(components, LogicTypeCompID)).set(id, logicType);
  }

  function setIndex(IUintComp components, uint256 id, uint256 index) internal {
    IndexComponent(getAddressById(components, IndexCompID)).set(id, index);
  }

  function setType(IUintComp components, uint256 id, string memory type_) internal {
    TypeComponent(getAddressById(components, TypeCompID)).set(id, type_);
  }

  function setValue(IUintComp components, uint256 id, uint256 value) internal {
    ValueComponent(getAddressById(components, ValueCompID)).set(id, value);
  }

  ///////////////////////
  // GETTERS

  function getValue(IUintComp components, uint256 id) internal view returns (uint256 result) {
    ValueComponent comp = ValueComponent(getAddressById(components, ValueCompID));
    if (comp.has(id)) result = comp.getValue(id);
  }

  ///////////////////////
  // UTILS

  /// @notice determines objective logic handler and operator
  /// @dev gets the logic from a formatted string - "[HANDLER]_[LOGIC]"
  function _parseLogic(string memory logicType) internal pure returns (HANDLER, LOGIC) {
    HANDLER handler;
    LOGIC operator;

    if (LibString.startsWith(logicType, "CURR")) handler = HANDLER.CURRENT;
    else if (LibString.startsWith(logicType, "INC")) handler = HANDLER.INCREASE;
    else if (LibString.startsWith(logicType, "DEC")) handler = HANDLER.DECREASE;
    else if (LibString.startsWith(logicType, "BOOL")) handler = HANDLER.BOOLEAN;
    else require(false, "Unknown condition handler");

    if (LibString.endsWith(logicType, "MIN")) operator = LOGIC.MIN;
    else if (LibString.endsWith(logicType, "MAX")) operator = LOGIC.MAX;
    else if (LibString.endsWith(logicType, "EQUAL")) operator = LOGIC.EQUAL;
    else if (LibString.endsWith(logicType, "IS")) operator = LOGIC.IS;
    else if (LibString.endsWith(logicType, "NOT")) operator = LOGIC.NOT;
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
