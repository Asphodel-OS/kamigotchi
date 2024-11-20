// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";

import { DescriptionComponent, ID as DescriptionCompID } from "components/DescriptionComponent.sol";
import { IDParentComponent, ID as IDParentCompID } from "components/IDParentComponent.sol";
import { IsCompleteComponent, ID as IsCompleteCompID } from "components/IsCompleteComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IndexRoomComponent, ID as IndexRoomCompID } from "components/IndexRoomComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibArray } from "libraries/utils/LibArray.sol";
import { LibComp } from "libraries/utils/LibComp.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibReference } from "libraries/utils/LibReference.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { Condition, LibConditional } from "libraries/LibConditional.sol";
import { LibData } from "libraries/LibData.sol";
import { LibReward } from "libraries/LibReward.sol";
import { LibScore } from "libraries/LibScore.sol";

/**
 * @notice LibGoals handles goals - a community quests that can be contributed to by many players
 *
 * Goals are made of
 * - Details (room, name, description, etc)
 * - Objectives (targets to be achieved, e.g. reach a certain amount of coins)
 *   - Objectives are mapped 1 to 1 with a Goal;
 *   - to achieve a Goal with multiple objectives, create multiple Goals
 * - Requirements (generic account requirements via LibConditional)
 * - Tiers (e.g. bronze, silver, gold) - uses LibReference
 *   - Intimidiate entity to split rewards based on contribution
 *     - Higher tiers also recieve lower tier rewards (eg Gold gets Gold + Silver + Bronze)
 *     - Uses ValueComp as the min contribution to qualify for a tier
 *       - eg Bronze ValueComp = 100, contribution >= 100 to qualify for Bronze
 * - Rewards (standard reward shape)
 *   - Goals track their Rewards through Tiers rather than the goal directly
 *   - When querying: Goal -> Tier -> Reward
 * - Balance
 *   - Stores current goal progress
 *
 * Contributing to goals results in a Contribution Entity (goal+account)
 * - Contributions uses LibScore to track points for leaderboard compatibility
 *   - epoch is not used
 * - stores Contribution Points in ValueComponent (via score)
 * - stores whether the goal has been completed in IsCompleteComponent
 */
library LibGoals {
  using LibString for string;
  using LibComp for IUintComp;

  /////////////////
  // SHAPES

  /// @notice creates a goal
  function create(
    IUintComp components,
    uint32 index,
    string memory name,
    string memory description,
    uint32 roomIndex,
    Condition memory objective
  ) internal returns (uint256 id) {
    id = genGoalID(index);
    LibEntityType.set(components, id, "GOAL");
    IndexComponent(getAddrByID(components, IndexCompID)).set(id, index);
    NameComponent(getAddrByID(components, NameCompID)).set(id, name);
    DescriptionComponent(getAddrByID(components, DescriptionCompID)).set(id, description);
    if (roomIndex != 0)
      IndexRoomComponent(getAddrByID(components, IndexRoomCompID)).set(id, roomIndex);

    // adding the objective
    uint256 objID = genObjID(id);
    LibConditional.create(components, objID, objective);
  }

  /// @notice creates a reward tier, if it doesn't yet exist
  function createTier(
    IUintComp components,
    uint32 goalIndex,
    string memory name,
    uint256 tier // tier 0 signifies display only tier; does not distribute rewards
  ) internal returns (uint256 id) {
    id = LibReference.create(components, "goal.tier", tier, genGoalID(goalIndex));
    NameComponent(getAddrByID(components, NameCompID)).set(id, name);
    ValueComponent(getAddrByID(components, ValueCompID)).set(id, tier);
  }

  /// @notice adds a requirement to a goal
  function addRequirement(
    IWorld world,
    IUintComp components,
    uint32 goalIndex,
    Condition memory requirement
  ) internal returns (uint256 id) {
    id = LibConditional.createFor(world, components, requirement, genReqParentID(goalIndex));
  }

  /// @notice adds a reward to a goal
  /**  @dev
   * - Rewards (e.g. coins, items, etc)
   *   - Tiered - eg Bronze, Silver, Gold
   *     - Higher tiers also recieve lower tier rewards (eg Gold gets Gold + Silver + Bronze)
   *     - Uses LevelComp as the min contribution to qualify for a tier
   *       - eg Bronze LevelComp = 100, contribution >= 100 to qualify for Bronze
   *   - Shape: Condition + Level + Name
   *     - Condition shape handles reward type and quantity
   *     - Logic type is either "REWARD" or "DISPLAY_ONLY"
   *
   * RewardIDs override deterministic LibReward generation, to allow for differing reward levels
   */
  /// @param tier needed to qualify for tier; "DISPLAY_ONLY" do not have this
  function addReward(
    IWorld world,
    IUintComp components,
    uint32 goalIndex,
    string memory name,
    uint256 tier, // level comp
    string memory logic,
    string memory type_,
    uint32 index,
    uint32[] memory keys,
    uint256[] memory weights,
    uint256 value
  ) internal returns (uint256 id) {
    uint256 parentID = genRwdParentID(createTier(components, goalIndex, name, tier));
    if (index == 0) {
      // override index for deterministic ID generation if no index provided
      // for ITEM_DROPTABLE or DISPLAY_ONLY
      id = LibReward.genID(
        parentID,
        type_,
        LibReward.getIndexOverride(components, parentID, type_) // quantity of same type
      );
    } else {
      id = LibReward.genID(parentID, type_, index);
    }

    LibReward._create(components, id, parentID, type_, index, keys, weights, value);
  }

  function remove(IUintComp components, uint32 index) internal {
    uint256 goalID = genGoalID(index);
    LibEntityType.remove(components, goalID);
    IndexComponent(getAddrByID(components, IndexCompID)).remove(goalID);
    NameComponent(getAddrByID(components, NameCompID)).remove(goalID);
    DescriptionComponent(getAddrByID(components, DescriptionCompID)).remove(goalID);
    IndexRoomComponent(getAddrByID(components, IndexRoomCompID)).remove(goalID);
    IsCompleteComponent(getAddrByID(components, IsCompleteCompID)).remove(goalID);

    // remove objective
    uint256 objID = genObjID(goalID);
    LibConditional.remove(components, objID);

    // remove requirements
    uint256[] memory reqIDs = getRequirements(components, index);
    LibConditional.remove(components, reqIDs);

    // remove tiers
    uint256[] memory tierIDs = getTiers(components, index);
    removeTiers(components, tierIDs);

    // remove rewards
    uint256[] memory rewIDs = getRewards(components, tierIDs);
    LibReward.remove(components, rewIDs);
  }

  function removeTiers(IUintComp components, uint256[] memory ids) internal {
    LibReference.remove(components, ids);
    NameComponent(getAddrByID(components, NameCompID)).remove(ids);
    ValueComponent(getAddrByID(components, ValueCompID)).remove(ids);
  }

  /////////////////
  // INTERACTIONS

  /// @notice contributes to a goal
  function contribute(
    IUintComp components,
    uint256 accID,
    uint256 goalID,
    uint256 amt
  ) internal returns (uint256) {
    uint256 objID = genObjID(goalID);
    IUintComp balComp = IUintComp(getAddrByID(components, ValueCompID));
    uint256 currBal = balComp.safeGet(goalID);
    uint256 targetBal = balComp.safeGet(objID);

    // cap contribution to target balance
    if (currBal + amt >= targetBal) {
      // goal completed, set it so
      amt = targetBal - currBal;
      setComplete(components, goalID);
    }

    // dec account's balance
    string memory type_ = LibConditional.getType(components, objID);
    uint32 index = LibConditional.getIndex(components, objID);
    LibAccount.decBalanceOf(components, accID, type_, index, amt);

    // inc goal's balance & inc account contribution
    balComp.set(goalID, currBal + amt);
    incContribution(components, accID, goalID, amt);

    return amt;
  }

  function distributeRewards(
    IWorld world,
    IUintComp components,
    uint32 goalIndex,
    uint256 goalID,
    uint256 accID
  ) internal {
    uint256[] memory activeTiers = getClaimableTiers(components, goalIndex, goalID, accID);
    uint256[] memory rwdIDs = getRewards(components, activeTiers);
    LibReward.distribute(world, components, rwdIDs, accID);
  }

  ////////////////////
  // CHECKERS

  function verifyClaimable(IUintComp components, uint256 goalID, uint256 accID) internal view {
    if (!canClaim(components, goalID, accID)) revert("cannot claim from this goal");
  }

  function verifyContributable(
    IUintComp components,
    uint32 goalIndex,
    uint256 goalID,
    uint256 accID
  ) internal view {
    if (!canContribute(components, goalIndex, goalID, accID))
      revert("cannot contribute to this goal");
  }

  function canClaim(
    IUintComp components,
    uint256 goalID,
    uint256 accID
  ) internal view returns (bool) {
    if (!checkRoom(components, goalID, accID)) return false; // wrong room

    uint256 contributionID = genContributionID(goalID, accID);
    IsCompleteComponent completeComp = IsCompleteComponent(
      getAddrByID(components, IsCompleteCompID)
    );
    bool goalCompleted = completeComp.has(goalID);
    bool accClaimed = completeComp.has(contributionID);

    bool accContributed = ValueComponent(getAddrByID(components, ValueCompID)).has(contributionID);
    // true if goal completed, account contributed, account hasnt claimed reward
    return goalCompleted && accContributed && !accClaimed;
  }

  function canContribute(
    IUintComp components,
    uint32 goalIndex,
    uint256 goalID,
    uint256 accID
  ) internal view returns (bool) {
    uint256[] memory requirements = getRequirements(components, goalIndex);
    if (!checkRequirements(components, accID, requirements)) return false;

    if (!checkRoom(components, goalID, accID)) return false; // wrong room
    if (isComplete(components, goalID)) return false; // goal already completed

    return true;
  }

  function checkRequirements(
    IUintComp components,
    uint256 accID,
    uint256[] memory requirements
  ) internal view returns (bool) {
    return LibConditional.checkConditions(components, requirements, accID);
  }

  function checkRoom(
    IUintComp components,
    uint256 goalID,
    uint256 accID
  ) internal view returns (bool) {
    IndexRoomComponent comp = IndexRoomComponent(getAddrByID(components, IndexRoomCompID));
    if (!comp.has(goalID)) return true; // global goal, no room needed

    return comp.get(goalID) == comp.get(accID);
  }

  function isComplete(IUintComp components, uint256 id) internal view returns (bool) {
    return IsCompleteComponent(getAddrByID(components, IsCompleteCompID)).has(id);
  }

  ///////////////////
  // SETTERS

  function incContribution(
    IUintComp components,
    uint256 holderID,
    uint256 goalID,
    uint256 amt
  ) internal {
    uint256 id = genContributionID(goalID, holderID);
    LibScore.incFor(components, id, holderID, goalID, amt);
  }

  function setComplete(IUintComp components, uint256 id) internal {
    IsCompleteComponent(getAddrByID(components, IsCompleteCompID)).set(id);
  }

  function setClaimed(IUintComp components, uint256 goalID, uint256 accID) internal {
    IsCompleteComponent(getAddrByID(components, IsCompleteCompID)).set(
      genContributionID(goalID, accID)
    );
  }

  ////////////////////
  // GETTERS

  function getByIndex(IUintComp components, uint32 index) internal view returns (uint256) {
    uint256 id = genGoalID(index);
    return LibEntityType.isShape(components, id, "GOAL") ? id : 0;
  }

  function getContributionAmt(
    IUintComp components,
    uint256 goalID,
    uint256 accID
  ) internal view returns (uint256) {
    ValueComponent comp = ValueComponent(getAddrByID(components, ValueCompID));
    uint256 id = genContributionID(goalID, accID);
    return comp.has(id) ? comp.get(id) : 0;
  }

  function getTiers(
    IUintComp components,
    uint32 goalIndex
  ) internal view returns (uint256[] memory) {
    return LibReference.queryByParent(components, "goal.tier", genGoalID(goalIndex));
  }

  function getRequirements(
    IUintComp components,
    uint32 goalIndex
  ) internal view returns (uint256[] memory) {
    return LibConditional.queryFor(components, genReqParentID(goalIndex));
  }

  function getRewards(
    IUintComp components,
    uint256[] memory tierIDs
  ) internal view returns (uint256[] memory) {
    uint256[][] memory tierRewards = new uint256[][](tierIDs.length);
    for (uint256 i; i < tierIDs.length; i++) {
      tierRewards[i] = LibReward.queryFor(components, genRwdParentID(tierIDs[i]));
    }
    return LibArray.flatten(tierRewards);
  }

  /// @notice gets tiers that user qualifies for
  function getClaimableTiers(
    IUintComp components,
    uint32 goalIndex,
    uint256 goalID,
    uint256 accID
  ) internal view returns (uint256[] memory) {
    uint256[] memory tierIDs = getTiers(components, goalIndex);
    uint256[] memory tiers = ValueComponent(getAddrByID(components, ValueCompID)).safeGet(tierIDs);

    // filter out unreached tiers and display only tiers that are reached
    uint256 contribution = getContributionAmt(components, goalID, accID);
    for (uint256 i; i < tierIDs.length; i++) {
      if (tiers[i] == 0 || contribution < tiers[i]) tierIDs[i] = 0;
    }

    return tierIDs;
  }

  ////////////////////
  // LOGGING

  /// @notice log overall goal contirbution, not specific goal
  function logContribution(IUintComp components, uint256 accID, uint256 amt) internal {
    LibData.inc(components, accID, 0, "GOAL_CONTRIBUTION", amt);
  }

  ///////////////////////
  // UTILS

  function genGoalID(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("goal", index)));
  }

  function genContributionID(uint256 goalID, uint256 accID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("goal.contribution", goalID, accID)));
  }

  function genObjID(uint256 goalID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("goal.objective", goalID)));
  }

  /// @notice Retrieve the ID of a requirement array
  function genReqParentID(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("goal.requirement", index)));
  }

  /// @notice Retrieve the ID of a reward array
  function genRwdParentID(uint256 tierID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("goal.reward", tierID)));
  }
}
