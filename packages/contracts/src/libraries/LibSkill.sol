// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById, getComponentById, addressToEntity } from "solecs/utils.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { LibString } from "solady/utils/LibString.sol";

import { CostComponent, ID as CostCompID } from "components/CostComponent.sol";
import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IsSkillComponent, ID as IsSkillCompID } from "components/IsSkillComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IndexSkillComponent, ID as IndexSkillCompID } from "components/IndexSkillComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";
import { MaxComponent, ID as MaxCompID } from "components/MaxComponent.sol";
import { SkillPointComponent, ID as SPCompID } from "components/SkillPointComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRegistrySkill } from "libraries/LibRegistrySkill.sol";

library LibSkill {
  /////////////////
  // INTERACTIONS

  // create a skill for an entity
  function create(
    IWorld world,
    IUintComp components,
    uint256 targetID,
    uint256 skillIndex
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIsSkill(components, id);
    setHolder(components, id, targetID);
    setSkillIndex(components, id, skillIndex);
    return id;
  }

  // increase skill points by a specified value
  function inc(IUintComp components, uint256 id, uint256 value) internal {
    uint256 curr = getPoints(components, id);
    setPoints(components, id, curr + value);
  }

  // decrease skillPoints by a specified value
  function dec(IUintComp components, uint256 id, uint256 value) internal {
    uint256 curr = getPoints(components, id);
    require(curr >= value, "LibSkill: not enough points");
    setPoints(components, id, curr - value);
  }

  // processes the upgrade of a stat increment/decrement effect
  // assume the holder's bonus entity exists
  function processStatEffectUpgrade(
    IUintComp components,
    uint256 holderID,
    uint256 effectID
  ) internal {
    uint256 bonusID = LibBonus.getByHolder(components, holderID);
    string memory subtype = LibRegistrySkill.getSubtype(components, effectID);
    string memory logicType = LibRegistrySkill.getLogicType(components, effectID);
    uint256 value = LibRegistrySkill.getValue(components, effectID);

    if (LibString.eq(logicType, "INC")) LibBonus.incStat(components, bonusID, subtype, value);
    else if (LibString.eq(logicType, "DEC")) LibBonus.decStat(components, bonusID, subtype, value);
  }

  /////////////////
  // CHECKERS

  // check the existing points, max level, and requirements to access a skill
  function checkPrerequisites(
    IUintComp components,
    uint256 targetID,
    uint256 skillIndex
  ) internal returns (bool) {
    uint256 skillID = LibRegistrySkill.getByIndex(components, skillIndex);
    require(skillID != 0, "no skill index found");

    // checking points
    uint256 cost = getCost(components, skillID);
    if (getPoints(components, targetID) < cost) return false;
    else dec(components, targetID, cost);

    // checking max skill level
    uint256 existingID = get(components, targetID, skillIndex);
    if (existingID != 0 && getPoints(components, existingID) >= getMax(components, skillID))
      return false;

    // check all other requirements
    uint256[] memory requirements = LibRegistrySkill.getRequirementsByIndex(components, skillIndex);
    for (uint256 i; i < requirements.length; i++)
      if (!checkRequirement(components, targetID, requirements[i])) return false;

    return true;
  }

  function checkRequirement(
    IUintComp components,
    uint256 targetID,
    uint256 reqID
  ) internal view returns (bool) {
    string memory type_ = getType(components, reqID);
    if (LibString.eq(type_, "LEVEL")) {
      return getLevel(components, targetID) >= getValue(components, reqID);
    }
    if (LibString.eq(type_, "SKILL")) {
      uint256 index = getIndex(components, reqID);
      return getPointsOf(components, targetID, index) >= getValue(components, reqID);
    }
    if (LibString.eq(type_, "AFFINITY")) {
      require(false, "LibSkill: affinity requirement not yet implemented");
    }

    return true;
  }

  function hasPoints(IUintComp components, uint256 id) internal view returns (bool) {
    return SkillPointComponent(getAddressById(components, SPCompID)).has(id);
  }

  /////////////////
  // SETTERS

  function setIsSkill(IUintComp components, uint256 id) internal {
    IsSkillComponent(getAddressById(components, IsSkillCompID)).set(id);
  }

  function setSkillIndex(IUintComp components, uint256 id, uint256 index) internal {
    IndexSkillComponent(getAddressById(components, IndexSkillCompID)).set(id, index);
  }

  function setHolder(IUintComp components, uint256 id, uint256 value) internal {
    IdHolderComponent(getAddressById(components, IdHolderCompID)).set(id, value);
  }

  function setPoints(IUintComp components, uint256 id, uint256 value) internal {
    SkillPointComponent(getAddressById(components, SPCompID)).set(id, value);
  }

  /////////////////
  // GETTERS

  function getCost(IUintComp components, uint256 id) internal view returns (uint256) {
    return CostComponent(getAddressById(components, CostCompID)).getValue(id);
  }

  function getIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexComponent(getAddressById(components, IndexCompID)).getValue(id);
  }

  function getLevel(IUintComp components, uint256 id) internal view returns (uint256) {
    return LevelComponent(getAddressById(components, LevelCompID)).getValue(id);
  }

  function getPoints(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!hasPoints(components, id)) return 0;
    return SkillPointComponent(getAddressById(components, SPCompID)).getValue(id);
  }

  function getMax(IUintComp components, uint256 id) internal view returns (uint256) {
    return MaxComponent(getAddressById(components, MaxCompID)).getValue(id);
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).getValue(id);
  }

  function getValue(IUintComp components, uint256 id) internal view returns (uint256) {
    return ValueComponent(getAddressById(components, ValueCompID)).getValue(id);
  }

  // get the point value of a specific skill for a target
  function getPointsOf(
    IUintComp components,
    uint256 holderID,
    uint256 index
  ) internal view returns (uint256) {
    uint256 id = get(components, holderID, index);
    return getPoints(components, id);
  }

  /////////////////
  // QUERIES

  function get(
    IUintComp components,
    uint256 holderID,
    uint256 index
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
      getComponentById(components, IndexSkillCompID),
      abi.encode(index)
    );

    uint256[] memory results = LibQuery.query(fragments);

    if (results.length == 0) return 0;
    return results[0];
  }
}
