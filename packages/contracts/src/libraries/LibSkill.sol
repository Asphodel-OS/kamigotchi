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

import { LibAccount } from "libraries/LibAccount.sol";
import { LibBoolean } from "libraries/utils/LibBoolean.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibSkillRegistry } from "libraries/LibSkillRegistry.sol";
import { LibStat } from "libraries/LibStat.sol";

uint256 constant TREE_POINTS_PER_TIER = 5;

library LibSkill {
  using LibString for string;

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
  function processEffectUpgrade(IUintComp components, uint256 holderID, uint256 effectID) public {
    if (LibSkillRegistry.getType(components, effectID).eq("STAT")) {
      processStatEffectUpgrade(components, holderID, effectID);
    } else {
      processGeneralEffectUpgrade(components, holderID, effectID);
    }
  }

  // process the upgrade of a generic skill inc/dec effect
  function processGeneralEffectUpgrade(
    IUintComp components,
    uint256 holderID,
    uint256 effectID
  ) internal {
    string memory type_ = LibSkillRegistry.getType(components, effectID);
    string memory subtype = LibSkillRegistry.getSubtype(components, effectID);
    string memory bonusType;
    if (subtype.eq("")) bonusType = type_;
    else bonusType = LibString.concat(LibString.concat(type_, "_"), subtype);
    int256 value = LibSkillRegistry.getBalanceSigned(components, effectID);

    LibBonus.inc(components, holderID, bonusType, value);
  }

  // processes the upgrade of a stat increment/decrement effect
  // assume the holder's bonus entity exists
  function processStatEffectUpgrade(
    IUintComp components,
    uint256 holderID,
    uint256 effectID
  ) internal {
    string memory subtype = LibSkillRegistry.getSubtype(components, effectID);
    int32 amt = int32(LibSkillRegistry.getBalanceSigned(components, effectID));

    LibStat.shift(components, holderID, subtype, amt);
  }

  /////////////////
  // CHECKERS

  function hasPoints(IUintComp components, uint256 id) internal view returns (bool) {
    return SkillPointComponent(getAddressById(components, SPCompID)).has(id);
  }

  /// @notice check whether the target meets the prerequisites to invest in a skill
  /// @dev prereqs include cost of skill, max points, and requirements
  function meetsPrerequisites(
    IUintComp components,
    uint256 targetID,
    uint256 registryID // skill registry entity id
  ) internal view returns (bool) {
    uint32 skillIndex = LibSkillRegistry.getSkillIndex(components, registryID);

    // check point balance against skill cost
    uint256 cost = LibSkillRegistry.getCost(components, registryID);
    if (getPoints(components, targetID) < cost) return false;

    // check current points invested in this skill against the max
    uint256 id = get(components, targetID, skillIndex);
    uint256 max = LibSkillRegistry.getMax(components, registryID);
    if (getPoints(components, id) >= max) return false;

    // check skill tree
    if (!meetsTreePrerequisites(components, targetID, registryID)) return false;

    // check all other requirements
    uint256[] memory requirements = LibSkillRegistry.getRequirementsByIndex(components, skillIndex);
    return LibBoolean.checkConditions(components, requirements, targetID);
  }

  /// @notice check if entity has invested enough in a the appropriate skill tree
  function meetsTreePrerequisites(
    IUintComp components,
    uint256 targetID,
    uint256 registryID
  ) internal view returns (bool) {
    (bool has, string memory tree, uint256 tier) = LibSkillRegistry.getTree(components, registryID);

    if (!has) return true; // if no skill tree, automatically pass
    if (tier == 0) return true; // if tier 0, automatically pass

    // check if target has enough points
    uint256 requirement = getTreeTierPoints(components, tier);
    return getTreePoints(components, targetID, tree) >= requirement;
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
    SkillPointComponent comp = SkillPointComponent(getAddressById(components, SPCompID));
    return comp.has(id) ? comp.get(id) : 0;
  }

  function getMax(IUintComp components, uint256 id) internal view returns (uint256) {
    return MaxComponent(getAddressById(components, MaxCompID)).get(id);
  }

  function getTreePoints(
    IUintComp components,
    uint256 id,
    string memory tree
  ) internal view returns (uint256) {
    return LibDataEntity.get(components, id, 0, tree.concat("SKILL_POINTS_USE"));
  }

  function getTreeTierPoints(IUintComp components, uint256 tier) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_TREE_REQ");
    return config[tier];
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).get(id);
  }

  // get the point value of a specific skill for a target
  function getPointsOf(
    IUintComp components,
    uint256 holderID,
    uint32 index
  ) internal view returns (uint256) {
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

  /// @notice uses a skill point in a skill tree
  function logUseTreePoint(
    IUintComp components,
    uint256 holderID,
    uint256 registryID,
    uint256 cost
  ) internal {
    (bool has, string memory tree, ) = LibSkillRegistry.getTree(components, registryID);
    if (has) LibDataEntity.inc(components, holderID, 0, tree.concat("SKILL_POINTS_USE"), cost);
  }

  //////////////////////
  // UTILS

  function genID(uint256 holderID, uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("skill.instance", holderID, index)));
  }
}
