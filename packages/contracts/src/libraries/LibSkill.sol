// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById, getComponentById, addressToEntity } from "solecs/utils.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { LibString } from "solady/utils/LibString.sol";

import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IsSkillComponent, ID as IsSkillCompID } from "components/IsSkillComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { SkillPointComponent, ID as SPCompID } from "components/SkillPointComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRegistrySkill } from "libraries/LibRegistrySkill.sol";

enum LOGIC {
  MIN,
  MAX,
  EQUAL,
  IS,
  NOT
}

library LibSkill {
  /////////////////
  // INTERACTIONS

  // assigns all skills to an entity
  function assignSkillFromIndex(
    IWorld world,
    IUintComp components,
    uint256 targetID,
    uint256 skillIndex
  ) internal returns (uint256[] memory results) {
    uint256[] memory toAssign = LibRegistrySkill.getSkillsByIndex(components, skillIndex);
    results = new uint256[](toAssign.length);

    for (uint256 i = 0; i < toAssign.length; i++) {
      results[i] = assignSingleSkill(world, components, targetID, toAssign[i]);
    }
  }

  // assign single skill to entity
  function assignSingleSkill(
    IWorld world,
    IUintComp components,
    uint256 targetID,
    uint256 skillID
  ) internal returns (uint256 resultID) {
    string memory skillType = getType(components, skillID);
    resultID = queryBySkillType(components, targetID, skillType);
    if (resultID == 0) {
      // no existing skill of this type, create new
      resultID = world.getUniqueEntityId();
      setBalance(components, resultID, 1); // skill level
      setIsSkill(components, resultID);
      setHolder(components, resultID, targetID);
      setType(components, resultID, skillType);
    } else {
      // has existing skill of this type, increase level
      incSkillLevel(components, resultID, 1);
    }
  }

  // checks requirements to assign skills
  // list of logicTypes:
  // GREATER: min current balance
  // LESSER: max current balance
  // EQUAL: equal current balance
  // USE: min current balance, but consumes resource
  function checkRequirements(
    IUintComp components,
    uint256 targetID,
    uint256 skillIndex
  ) internal returns (bool) {
    uint256[] memory requirements = LibRegistrySkill.getRequirementsByIndex(components, skillIndex);

    for (uint256 i; i < requirements.length; i++) {
      string memory logicType = getLogicType(components, requirements[i]);
      bool result;

      if (LibString.eq(logicType, "GREATER")) {
        result = checkCurrent(components, requirements[i], targetID, LOGIC.MIN);
      } else if (LibString.eq(logicType, "LESSER")) {
        result = checkCurrent(components, requirements[i], targetID, LOGIC.MAX);
      } else if (LibString.eq(logicType, "EQUAL")) {
        result = checkCurrent(components, requirements[i], targetID, LOGIC.EQUAL);
      } else if (LibString.eq(logicType, "USE")) {
        result = checkUseCurrent(components, requirements[i], targetID);
      } else {
        require(false, "Unknown requirement logic type");
      }

      if (!result) {
        return false;
      }
    }

    return true;
  }

  function checkCurrent(
    IUintComp components,
    uint256 conditionID,
    uint256 targetID,
    LOGIC logic
  ) internal view returns (bool) {
    // details of condition
    string memory _type = getType(components, conditionID);
    uint256 index = getIndex(components, conditionID);
    uint256 expected = getValue(components, conditionID);

    // check account
    uint256 targetValue = getBalanceOf(components, targetID, _type, index);

    return checkLogicOperator(targetValue, expected, logic);
  }

  function checkUseCurrent(
    IUintComp components,
    uint256 conditionID,
    uint256 targetID
  ) internal returns (bool) {
    // details of condition
    string memory _type = getType(components, conditionID);
    uint256 index = getIndex(components, conditionID);
    uint256 expected = getValue(components, conditionID);

    // use resource
    return useBalanceOf(components, targetID, expected, _type, index);
  }

  // if type is related to skill, handle it here. else direct to account/pet logic
  function getBalanceOf(
    IUintComp components,
    uint256 targetID,
    string memory _type,
    uint256 index
  ) internal view returns (uint256) {
    if (LibString.eq(_type, "SKILL_POINT")) {
      return getPoints(components, targetID);
    } else if (LibString.eq(_type, "SKILL_LEVEL")) {
      uint256 skillID = queryBySkillType(components, targetID, getType(components, index));
      if (skillID == 0) return 0;
      return getBalance(components, skillID);
    } else {
      if (LibAccount.isAccount(components, targetID))
        return LibAccount.getBalanceOf(components, targetID, _type, index);
      // else if (LibPet.isPet(components, targetID)) return 0;
      // unimplemented for now - no reason to query pet balance yet
      else require(false, "Unknown entity type");
    }
  }

  function useBalanceOf(
    IUintComp components,
    uint256 targetID,
    uint256 amt,
    string memory _type,
    uint256 index
  ) internal returns (bool) {
    if (LibString.eq(_type, "SKILL_POINT")) {
      uint256 bal = getPoints(components, targetID);
      // require(bal >= amt, "LibSkill: target bal not enough");
      if (amt > bal) return false;
      decPoints(components, targetID, amt);
    } else {
      // unimplemented use logic -> account/pet selector
      require(false, "unknown use req type");
    }

    return true;
  }

  function incSkillLevel(IUintComp components, uint256 id, uint256 value) internal {
    uint256 curr = getBalance(components, id);
    setBalance(components, id, curr + value);
  }

  // increase skill points by a specified value
  function incPoints(IUintComp components, uint256 id, uint256 value) internal {
    uint256 curr = getPoints(components, id);
    setPoints(components, id, curr + value);
  }

  // decrease skillPoints by a specified value
  function decPoints(IUintComp components, uint256 id, uint256 value) internal {
    uint256 curr = getPoints(components, id);
    require(curr >= value, "LibSkill: not enough points");
    setPoints(components, id, curr - value);
  }

  /////////////////
  // CHECKERS

  function hasBalance(IUintComp components, uint256 id) internal view returns (bool) {
    return BalanceComponent(getAddressById(components, BalanceCompID)).has(id);
  }

  function hasIndex(IUintComp components, uint256 id) internal view returns (bool) {
    return IndexComponent(getAddressById(components, IndexCompID)).has(id);
  }

  function hasPoints(IUintComp components, uint256 id) internal view returns (bool) {
    return SkillPointComponent(getAddressById(components, SPCompID)).has(id);
  }

  function hasValue(IUintComp components, uint256 id) internal view returns (bool) {
    return ValueComponent(getAddressById(components, ValueCompID)).has(id);
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

  function setBalance(IUintComp components, uint256 id, uint256 value) internal {
    BalanceComponent(getAddressById(components, BalanceCompID)).set(id, value);
  }

  function setHolder(IUintComp components, uint256 id, uint256 value) internal {
    IdHolderComponent(getAddressById(components, IdHolderCompID)).set(id, value);
  }

  function setIsSkill(IUintComp components, uint256 id) internal {
    IsSkillComponent(getAddressById(components, IsSkillCompID)).set(id);
  }

  function setSkillLevel(IUintComp components, uint256 id, uint256 value) internal {
    setBalance(components, id, value);
  }

  function setType(IUintComp components, uint256 id, string memory value) internal {
    TypeComponent(getAddressById(components, TypeCompID)).set(id, value);
  }

  // set the Experience of an entity to the specified value
  function setPoints(IUintComp components, uint256 id, uint256 value) internal {
    SkillPointComponent(getAddressById(components, SPCompID)).set(id, value);
  }

  /////////////////
  // GETTERS

  function getBalance(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!hasBalance(components, id)) return 0;
    return BalanceComponent(getAddressById(components, BalanceCompID)).getValue(id);
  }

  function getIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!hasIndex(components, id)) return 0;
    return IndexComponent(getAddressById(components, IndexCompID)).getValue(id);
  }

  function getLogicType(IUintComp components, uint256 id) internal view returns (string memory) {
    return LogicTypeComponent(getAddressById(components, LogicTypeCompID)).getValue(id);
  }

  function getPoints(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!hasPoints(components, id)) return 0;
    return SkillPointComponent(getAddressById(components, SPCompID)).getValue(id);
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).getValue(id);
  }

  function getValue(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!hasValue(components, id)) return 0;
    return ValueComponent(getAddressById(components, ValueCompID)).getValue(id);
  }

  ///////////////
  // QUERIES
  function queryBySkillType(
    IUintComp components,
    uint256 holderID,
    string memory skillType
  ) internal view returns (uint256) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsSkillCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdHolderCompID),
      abi.encode(holderID)
    );
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, TypeCompID),
      abi.encode(skillType)
    );

    uint256[] memory results = LibQuery.query(fragments);

    if (results.length == 0) return 0;
    return results[0];
  }
}
