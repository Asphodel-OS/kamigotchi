// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById, getComponentById, addressToEntity } from "solecs/utils.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
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
import { LibBoolean } from "libraries/utils/LibBoolean.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRegistrySkill } from "libraries/LibRegistrySkill.sol";
import { LibStat } from "libraries/LibStat.sol";

library LibSkill {
  /////////////////
  // INTERACTIONS

  // create a skill for an entity
  function create(
    IUintComp components,
    uint256 targetID,
    uint32 skillIndex
  ) internal returns (uint256) {
    uint256 id = genID(targetID, skillIndex);
    setIsSkill(components, id);
    setHolder(components, id, targetID);
    setSkillIndex(components, id, skillIndex);
    return id;
  }

  // increase skill points of a skill by a specified value
  function inc(IUintComp components, uint256 id, uint256 value) internal {
    SkillPointComponent pointComp = SkillPointComponent(getAddressById(components, SPCompID));
    uint256 curr = pointComp.has(id) ? pointComp.get(id) : 0;
    pointComp.set(id, curr + value);
  }

  // decrease skillPoints by a specified value
  function dec(IUintComp components, uint256 id, uint256 value) internal {
    SkillPointComponent pointComp = SkillPointComponent(getAddressById(components, SPCompID));
    uint256 curr = pointComp.has(id) ? pointComp.get(id) : 0;
    require(curr >= value, "LibSkill: not enough points");
    pointComp.set(id, curr - value);
  }

  // process the upgrade of a skill (can be generic or stat skill)
  function processEffectUpgrade(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint256 effectID
  ) public {
    if (LibString.eq("STAT", LibRegistrySkill.getType(components, effectID))) {
      processStatEffectUpgrade(world, components, holderID, effectID);
    } else {
      processGeneralEffectUpgrade(world, components, holderID, effectID);
    }
  }

  // process the upgrade of a generic skill inc/dec effect
  function processGeneralEffectUpgrade(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint256 effectID
  ) internal {
    string memory type_ = LibRegistrySkill.getType(components, effectID);
    string memory subtype = LibRegistrySkill.getSubtype(components, effectID);
    string memory bonusType = LibString.concat(LibString.concat(type_, "_"), subtype);
    // get the bonus entity or create one if it doesnt exist
    // default the initial value to 0 if Cooldown type (otherwise 1000 implicitly)
    uint256 bonusID = LibBonus.get(components, holderID, bonusType);
    if (bonusID == 0) {
      bonusID = LibBonus.create(world, components, holderID, bonusType);
      if (LibString.eq("COOLDOWN", subtype)) LibBonus.setBalance(components, bonusID, 0);
    }
    string memory logicType = LibRegistrySkill.getLogicType(components, effectID);
    uint256 value = LibRegistrySkill.getBalance(components, effectID);
    if (LibString.eq(logicType, "INC")) LibBonus.inc(components, bonusID, value);
    else if (LibString.eq(logicType, "DEC")) LibBonus.dec(components, bonusID, value);
  }

  // processes the upgrade of a stat increment/decrement effect
  // assume the holder's bonus entity exists
  function processStatEffectUpgrade(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint256 effectID
  ) internal {
    string memory subtype = LibRegistrySkill.getSubtype(components, effectID);
    string memory logicType = LibRegistrySkill.getLogicType(components, effectID);
    int32 amt = int32(int(LibRegistrySkill.getBalance(components, effectID)));
    if (LibString.eq(logicType, "DEC")) amt *= -1;
    LibStat.shift(components, holderID, subtype, amt);
  }

  /////////////////
  // CHECKERS

  function hasPoints(IUintComp components, uint256 id) internal view returns (bool) {
    return SkillPointComponent(getAddressById(components, SPCompID)).has(id);
  }

  // check whether the target meets the prerequisites to invest in a skill
  // prereqs include cost of skill, max points, and requirements
  function meetsPrerequisites(
    IUintComp components,
    uint256 targetID,
    uint256 registryID // skill registry entity id
  ) public view returns (bool) {
    uint32 skillIndex = LibRegistrySkill.getSkillIndex(components, registryID);

    // check point balance against skill cost
    uint256 cost = LibRegistrySkill.getCost(components, registryID);
    if (getPoints(components, targetID) < cost) return false;

    // check current points invested in this skill against the max
    uint256 id = get(components, targetID, skillIndex);
    uint256 max = LibRegistrySkill.getMax(components, registryID);
    if (getPoints(components, id) >= max) return false;

    // check all other requirements
    uint256[] memory requirements = LibRegistrySkill.getRequirementsByIndex(components, skillIndex);
    return LibBoolean.checkConditions(components, requirements, targetID);
  }

  /////////////////
  // SETTERS

  function setIsSkill(IUintComp components, uint256 id) internal {
    IsSkillComponent(getAddressById(components, IsSkillCompID)).set(id);
  }

  function setSkillIndex(IUintComp components, uint256 id, uint32 index) internal {
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

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexComponent(getAddressById(components, IndexCompID)).get(id);
  }

  function getLevel(IUintComp components, uint256 id) internal view returns (uint256) {
    return LevelComponent(getAddressById(components, LevelCompID)).get(id);
  }

  function getPoints(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!hasPoints(components, id)) return 0;
    return SkillPointComponent(getAddressById(components, SPCompID)).get(id);
  }

  function getMax(IUintComp components, uint256 id) internal view returns (uint256) {
    return MaxComponent(getAddressById(components, MaxCompID)).get(id);
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).get(id);
  }

  function getValue(IUintComp components, uint256 id) internal view returns (uint256) {
    return ValueComponent(getAddressById(components, ValueCompID)).get(id);
  }

  // get the point value of a specific skill for a target
  function getPointsOf(
    IUintComp components,
    uint256 holderID,
    uint32 index
  ) internal view returns (uint256) {
    // // cheatcode to get account skill points (skill index never 0)
    // if (index == 0) return getPoints(components, holderID);

    uint256 id = get(components, holderID, index);
    return getPoints(components, id);
  }

  /////////////////
  // QUERIES

  function get(
    IUintComp components,
    uint256 holderID,
    uint32 index
  ) internal view returns (uint256) {
    uint256 id = genID(holderID, index);
    return IsSkillComponent(getAddressById(components, IsSkillCompID)).has(id) ? id : 0;
  }

  //////////////////////
  // LOGGING

  function logUsePoint(IUintComp components, uint256 holderID) internal {
    LibDataEntity.inc(components, holderID, 0, "SKILL_POINTS_USE", 1);
  }

  //////////////////////
  // UTILS

  function genID(uint256 holderID, uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("skill.instance", holderID, index)));
  }
}
