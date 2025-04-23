// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddrByID, getCompByID, addressToEntity } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";

import { IDOwnsSkillComponent as OwnerComponent, ID as OwnerCompID } from "components/IDOwnsSkillComponent.sol";
import { IndexSkillComponent, ID as IndexSkillCompID } from "components/IndexSkillComponent.sol";
import { SkillPointComponent, ID as SPCompID } from "components/SkillPointComponent.sol";

import { LibArray } from "libraries/utils/LibArray.sol";
import { LibComp } from "libraries/utils/LibComp.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";

import { LibBonus } from "libraries/LibBonus.sol";
import { LibConditional } from "libraries/LibConditional.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibData } from "libraries/LibData.sol";
import { LibFlag } from "libraries/LibFlag.sol";
import { LibSkillRegistry } from "libraries/LibSkillRegistry.sol";

uint256 constant TREE_POINTS_PER_TIER = 5;

library LibSkill {
  using LibArray for uint256[];
  using LibComp for IUintComp;
  using LibString for string;

  /////////////////
  // INTERACTIONS

  // assign a skill to an entity
  function assign(
    IUintComp components,
    uint32 skillIndex,
    uint256 targetID
  ) internal returns (uint256 id) {
    id = genID(targetID, skillIndex);
    LibEntityType.set(components, id, "SKILL");
    OwnerComponent(getAddrByID(components, OwnerCompID)).set(id, targetID);
    IndexSkillComponent(getAddrByID(components, IndexSkillCompID)).set(id, skillIndex);
  }

  /// @notice upgrades, increases points for skill by 1
  function upgradeFor(
    IUintComp components,
    uint32 skillIndex,
    uint256 targetID
  ) internal returns (uint256 id) {
    uint256 regID = LibSkillRegistry.genID(skillIndex);
    id = genID(targetID, skillIndex);

    // create skill if not yet assigned
    if (!LibEntityType.checkAndSet(components, id, "SKILL")) {
      OwnerComponent(getAddrByID(components, OwnerCompID)).set(id, targetID);
      IndexSkillComponent(getAddrByID(components, IndexSkillCompID)).set(id, skillIndex);
    }

    // adjusting points
    useCost(components, regID, id, targetID);

    // upgrading bonuses
    LibBonus.incBy(components, LibSkillRegistry.genBonusAnchor(skillIndex), id, targetID, 1);
  }

  /// @notice resets all skills, refund skill points
  function resetAll(IUintComp components, uint256 targetID) internal {
    uint256[] memory instanceIDs = queryForHolder(components, targetID);
    uint32[] memory indices = extractIndex(components, instanceIDs);
    uint256[] memory regIDs = LibSkillRegistry.genID(indices);

    // reset skill points (extracts points, adds to target)
    refundCosts(components, regIDs, instanceIDs, targetID);

    // remove bonuses
    for (uint256 i; i < instanceIDs.length; i++) {
      // potential optimisation here
      uint256[] memory bonusIDs = LibBonus.queryByParent(components, instanceIDs[i]);
      LibBonus.unassign(components, bonusIDs);
    }

    // deleting instances (remaining components)
    LibEntityType.remove(components, instanceIDs);
    OwnerComponent(getAddrByID(components, OwnerCompID)).remove(instanceIDs);
  }

  /// @notice uses cost of skill, upgrades
  /// @dev implicit insufficient points check
  function useCost(
    IUintComp components,
    uint256 regID,
    uint256 instanceID,
    uint256 targetID
  ) internal {
    uint256 cost = LibSkillRegistry.getCost(components, regID);

    SkillPointComponent pointsComp = SkillPointComponent(getAddrByID(components, SPCompID));
    pointsComp.dec(targetID, cost);
    pointsComp.inc(instanceID, 1);
  }

  /// @notice refunds skill points to target, extract skill levels
  function refundCosts(
    IUintComp components,
    uint256[] memory regIDs,
    uint256[] memory instanceIDs,
    uint256 targetID
  ) internal {
    SkillPointComponent pointComp = SkillPointComponent(getAddrByID(components, SPCompID));
    uint256[] memory instanceLevels = pointComp.extract(instanceIDs);
    uint256[] memory usedPts = LibSkillRegistry.getCost(components, regIDs);
    uint256 total = instanceLevels.multiply(usedPts).sum();
    pointComp.inc(targetID, total);
  }

  /////////////////
  // CHECKERS

  function verifyResettable(IUintComp components, uint256 targetID) public view {
    if (!LibFlag.has(components, targetID, "CAN_RESET_SKILLS"))
      revert("cannot reset skills (no flag)");
  }

  function verifyPrerequisites(
    IUintComp components,
    uint32 skillIndex,
    uint256 holderID
  ) public view {
    if (!meetsPrerequisites(components, skillIndex, holderID))
      revert("SkillUpgrade: unmet prerequisites");
  }

  function hasPoints(IUintComp components, uint256 id) internal view returns (bool) {
    return SkillPointComponent(getAddrByID(components, SPCompID)).has(id);
  }

  /// @notice check whether the target meets the prerequisites to invest in a skill
  /// @dev prereqs include cost of skill, max points, and requirements
  function meetsPrerequisites(
    IUintComp components,
    uint32 skillIndex,
    uint256 targetID
  ) internal view returns (bool) {
    uint256 registryID = LibSkillRegistry.genID(skillIndex);

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
    uint256[] memory requirements = LibSkillRegistry.queryRequirements(components, skillIndex);
    return LibConditional.check(components, requirements, targetID);
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
    return getTreePoints(components, tree, targetID) >= requirement;
  }

  /////////////////
  // SETTERS

  // increase skill points of a skill by a specified value
  function incPoints(IUintComp components, uint256 id, uint256 value) internal {
    SkillPointComponent(getAddrByID(components, SPCompID)).inc(id, value);
  }

  // decrease skillPoints by a specified value
  function decPoints(IUintComp components, uint256 id, uint256 value) internal {
    SkillPointComponent(getAddrByID(components, SPCompID)).dec(id, value);
  }

  function setPoints(IUintComp components, uint256 id, uint256 value) internal {
    SkillPointComponent(getAddrByID(components, SPCompID)).set(id, value);
  }

  function useReset(IUintComp components, uint256 targetID) internal {
    LibFlag.set(components, targetID, "CAN_RESET_SKILLS", false);
  }

  /////////////////
  // GETTERS

  function extractIndex(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (uint32[] memory) {
    return IndexSkillComponent(getAddrByID(components, IndexSkillCompID)).extract(ids);
  }

  function getPoints(IUintComp components, uint256 id) internal view returns (uint256) {
    return SkillPointComponent(getAddrByID(components, SPCompID)).safeGet(id);
  }

  function getTreePoints(
    IUintComp components,
    string memory tree,
    uint256 targetID
  ) internal view returns (uint256) {
    return LibBonus.getForUint256(components, tree, targetID);
  }

  function getTreeTierPoints(IUintComp components, uint256 tier) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_TREE_REQ");
    return config[tier];
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
    return LibEntityType.isShape(components, id, "SKILL") ? id : 0;
  }

  function queryForHolder(
    IUintComp components,
    uint256 holderID
  ) internal view returns (uint256[] memory) {
    return OwnerComponent(getAddrByID(components, OwnerCompID)).getEntitiesWithValue(holderID);
  }

  //////////////////////
  // LOGGING

  function logUsePoint(IUintComp components, uint256 holderID) public {
    LibData.inc(components, holderID, 0, "SKILL_POINTS_USE", 1);
  }

  //////////////////////
  // UTILS

  function genID(uint256 holderID, uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("skill.instance", holderID, index)));
  }
}
