// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";

import { DescriptionComponent, ID as DescriptionCompID } from "components/DescriptionComponent.sol";
import { IsCompleteComponent, ID as IsCompleteCompID } from "components/IsCompleteComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IndexRoomComponent, ID as IndexRoomCompID } from "components/IndexRoomComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibArray } from "libraries/utils/LibArray.sol";
import { LibComp } from "libraries/utils/LibComp.sol";
import { LibDisabled } from "libraries/utils/LibDisabled.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibReference } from "libraries/utils/LibReference.sol";
import { LibSetter } from "libraries/utils/LibSetter.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibAllo } from "libraries/LibAllo.sol";
import { Condition, LibConditional } from "libraries/LibConditional.sol";
import { LibData } from "libraries/LibData.sol";
import { LibScore } from "libraries/LibScore.sol";

/**
 * @notice LibGoal handles goals - a community quests that can be contributed to by many players
 *
 * Goals are made of
 * - Details (room, name, description, etc)
 * - Objectives (targets to be achieved, e.g. reach a certain amount of coins)
 *   - Objectives are mapped 1 to 1 with a Goal;
 *   - to achieve a Goal with multiple objectives, create multiple Goals
 * - Requirements (generic account requirements via LibConditional)
 * - Tiers (e.g. bronze, silver, gold)
 *   - Intimidiate entity to split rewards based on contribution
 *     - Higher tiers also recieve lower tier rewards (eg Gold gets Gold + Silver + Bronze)
 *     - Uses ValueComp as the min contribution to qualify for a tier
 *       - eg Bronze ValueComp = 100, contribution >= 100 to qualify for Bronze
 * - Rewards (standard reward shape)
 *   - Points to tiers, rather than the goal directly
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
library LibGoal {
  using LibString for string;
  using LibComp for IUintComp;

  /////////////////
  // SHAPES

  /// @notice creates a goal
  function create(
    IUintComp comps,
    uint32 index,
    string memory name,
    string memory description,
    uint32 roomIndex,
    Condition memory objective
  ) internal returns (uint256 id) {
    id = genGoalID(index);
    LibEntityType.set(comps, id, "GOAL");
    IndexComponent(getAddrByID(comps, IndexCompID)).set(id, index);
    NameComponent(getAddrByID(comps, NameCompID)).set(id, name);
    DescriptionComponent(getAddrByID(comps, DescriptionCompID)).set(id, description);
    if (roomIndex != 0) IndexRoomComponent(getAddrByID(comps, IndexRoomCompID)).set(id, roomIndex);
    LibDisabled.set(comps, id, true); // disabled initially

    // adding the objective
    uint256 objID = genObjID(id);
    LibConditional.create(comps, objID, objective);
  }

  /// @notice creates a reward tier, if it doesn't yet exist
  function createTier(
    IUintComp comps,
    uint32 goalIndex,
    string memory name,
    uint256 cutoff // cutoff 0 signifies display only tier; does not distribute rewards
  ) internal returns (uint256 id) {
    id = createTierRef(comps, goalIndex, cutoff);

    NameComponent(getAddrByID(comps, NameCompID)).set(id, name);
    ValueComponent(getAddrByID(comps, ValueCompID)).set(id, cutoff);
  }

  /// @notice adds a requirement to a goal
  function addRequirement(
    IWorld world,
    IUintComp comps,
    uint32 goalIndex,
    Condition memory requirement
  ) internal returns (uint256 id) {
    id = LibConditional.createFor(world, comps, requirement, genReqAnchor(goalIndex));
  }

  function remove(IUintComp comps, uint32 index) public {
    uint256 goalID = genGoalID(index);
    LibEntityType.remove(comps, goalID);
    IndexComponent(getAddrByID(comps, IndexCompID)).remove(goalID);
    NameComponent(getAddrByID(comps, NameCompID)).remove(goalID);
    DescriptionComponent(getAddrByID(comps, DescriptionCompID)).remove(goalID);
    IndexRoomComponent(getAddrByID(comps, IndexRoomCompID)).remove(goalID);
    IsCompleteComponent(getAddrByID(comps, IsCompleteCompID)).remove(goalID);
    LibDisabled.set(comps, goalID, false);

    // remove objective
    uint256 objID = genObjID(goalID);
    LibConditional.remove(comps, objID);

    // remove requirements
    uint256[] memory reqIDs = getRequirements(comps, index);
    LibConditional.remove(comps, reqIDs);

    removeRewards(comps, index);
  }

  function removeRewards(IUintComp comps, uint32 index) public {
    uint256[] memory tierIDs = getTiers(comps, index);
    removeTiers(comps, tierIDs);

    uint256[] memory rewIDs = getRewards(comps, tierIDs);
    LibAllo.remove(comps, rewIDs);
  }

  function removeTiers(IUintComp comps, uint256[] memory ids) public {
    LibReference.remove(comps, ids);
    NameComponent(getAddrByID(comps, NameCompID)).remove(ids);
    ValueComponent(getAddrByID(comps, ValueCompID)).remove(ids);
  }

  /////////////////
  // INTERACTIONS

  /// @notice contributes to a goal
  function contribute(
    IUintComp comps,
    uint256 accID,
    uint256 goalID,
    uint256 amt
  ) internal returns (uint256) {
    uint256 objID = genObjID(goalID);
    IUintComp valComp = IUintComp(getAddrByID(comps, ValueCompID));
    uint256 currBal = valComp.safeGet(goalID);
    uint256 targetBal = valComp.safeGet(objID);

    // cap contribution to target balance
    if (currBal + amt >= targetBal) {
      // goal completed, set it so
      amt = targetBal - currBal;
      setComplete(comps, goalID);
    }

    // dec account's balance
    string memory type_ = TypeComponent(getAddrByID(comps, TypeCompID)).get(objID);
    uint32 index = IndexComponent(getAddrByID(comps, IndexCompID)).safeGet(objID);
    LibSetter.dec(comps, type_, index, amt, accID);

    // inc goal's balance & inc account contribution
    valComp.set(goalID, currBal + amt);
    incContribution(comps, accID, goalID, amt);

    return amt;
  }

  function distributeRewards(
    IWorld world,
    IUintComp comps,
    uint32 goalIndex,
    uint256 goalID,
    uint256 accID
  ) internal {
    uint256[] memory activeTiers = getClaimableTiers(comps, goalIndex, goalID, accID);
    uint256[] memory rwdIDs = getRewards(comps, activeTiers);
    LibAllo.distribute(world, comps, rwdIDs, accID);
  }

  ////////////////////
  // CHECKERS

  function verifyEnabled(IUintComp comps, uint256 goalID) public view {
    return LibDisabled.verifyEnabled(comps, goalID);
  }

  function verifyClaimable(IUintComp comps, uint256 goalID, uint256 accID) public view {
    if (!canClaim(comps, goalID, accID)) revert("cannot claim from this goal");
  }

  function verifyContributable(
    IUintComp comps,
    uint32 goalIndex,
    uint256 goalID,
    uint256 accID
  ) public view {
    if (!canContribute(comps, goalIndex, goalID, accID)) revert("cannot contribute to this goal");
  }

  function canClaim(IUintComp comps, uint256 goalID, uint256 accID) internal view returns (bool) {
    if (!checkRoom(comps, goalID, accID)) return false; // wrong room

    uint256 contributionID = genContributionID(goalID, accID);
    IsCompleteComponent completeComp = IsCompleteComponent(getAddrByID(comps, IsCompleteCompID));
    bool goalCompleted = completeComp.has(goalID);
    bool accClaimed = completeComp.has(contributionID);

    bool accContributed = ValueComponent(getAddrByID(comps, ValueCompID)).has(contributionID);
    // true if goal completed, account contributed, account hasnt claimed reward
    return goalCompleted && accContributed && !accClaimed;
  }

  function canContribute(
    IUintComp comps,
    uint32 goalIndex,
    uint256 goalID,
    uint256 accID
  ) internal view returns (bool) {
    uint256[] memory requirements = getRequirements(comps, goalIndex);
    if (!checkRequirements(comps, accID, requirements)) return false;

    if (!checkRoom(comps, goalID, accID)) return false; // wrong room
    if (isComplete(comps, goalID)) return false; // goal already completed

    return true;
  }

  function checkRequirements(
    IUintComp comps,
    uint256 accID,
    uint256[] memory requirements
  ) internal view returns (bool) {
    return LibConditional.check(comps, requirements, accID);
  }

  function checkRoom(IUintComp comps, uint256 goalID, uint256 accID) internal view returns (bool) {
    IndexRoomComponent comp = IndexRoomComponent(getAddrByID(comps, IndexRoomCompID));
    if (!comp.has(goalID)) return true; // global goal, no room needed

    return comp.get(goalID) == comp.get(accID);
  }

  function isComplete(IUintComp comps, uint256 id) internal view returns (bool) {
    return IsCompleteComponent(getAddrByID(comps, IsCompleteCompID)).has(id);
  }

  ///////////////////
  // SETTERS

  function incContribution(
    IUintComp comps,
    uint256 holderID,
    uint256 goalID,
    uint256 amt
  ) internal {
    uint256 id = genContributionID(goalID, holderID);
    LibScore.incFor(comps, id, holderID, goalID, amt);
  }

  function setComplete(IUintComp comps, uint256 id) internal {
    IsCompleteComponent(getAddrByID(comps, IsCompleteCompID)).set(id);
  }

  function setClaimed(IUintComp comps, uint256 goalID, uint256 accID) internal {
    IsCompleteComponent(getAddrByID(comps, IsCompleteCompID)).set(genContributionID(goalID, accID));
  }

  ////////////////////
  // GETTERS

  function getByIndex(IUintComp comps, uint32 index) internal view returns (uint256) {
    uint256 id = genGoalID(index);
    return LibEntityType.isShape(comps, id, "GOAL") ? id : 0;
  }

  function getContributionAmt(
    IUintComp comps,
    uint256 goalID,
    uint256 accID
  ) internal view returns (uint256) {
    ValueComponent comp = ValueComponent(getAddrByID(comps, ValueCompID));
    uint256 id = genContributionID(goalID, accID);
    return comp.has(id) ? comp.get(id) : 0;
  }

  function getTiers(IUintComp comps, uint32 goalIndex) internal view returns (uint256[] memory) {
    return LibReference.queryByParent(comps, genTierAnchorID(goalIndex));
  }

  function getRequirements(
    IUintComp comps,
    uint32 goalIndex
  ) internal view returns (uint256[] memory) {
    return LibConditional.queryFor(comps, genReqAnchor(goalIndex));
  }

  function getRewards(
    IUintComp comps,
    uint256[] memory tierIDs
  ) internal view returns (uint256[] memory) {
    uint256[] memory anchorIDs = new uint256[](tierIDs.length);
    for (uint256 i; i < tierIDs.length; i++) anchorIDs[i] = genAlloAnchor(tierIDs[i]);
    return LibAllo.queryFor(comps, anchorIDs);
  }

  /// @notice gets tiers that user qualifies for
  function getClaimableTiers(
    IUintComp comps,
    uint32 goalIndex,
    uint256 goalID,
    uint256 accID
  ) internal view returns (uint256[] memory) {
    uint256[] memory tierIDs = getTiers(comps, goalIndex);
    uint256[] memory cutoffs = ValueComponent(getAddrByID(comps, ValueCompID)).safeGet(tierIDs);

    // filter out unreached tiers and display only tiers that are reached
    uint256 contribution = getContributionAmt(comps, goalID, accID);
    for (uint256 i; i < tierIDs.length; i++) {
      if (cutoffs[i] == 0 || contribution < cutoffs[i]) tierIDs[i] = 0;
    }

    return tierIDs;
  }

  ////////////////////
  // LOGGING

  /// @notice log overall goal contirbution, not specific goal
  function logContribution(IUintComp comps, uint256 accID, uint256 amt) public {
    LibData.inc(comps, accID, 0, "GOAL_CONTRIBUTION", amt);
  }

  ///////////////////////
  // UTILS

  /// @dev tier reference, a null entity that points to a tier with specific cutoff
  function createTierRef(
    IUintComp comps,
    uint32 goalIndex,
    uint256 cutoff
  ) internal returns (uint256) {
    return LibReference.create(comps, "goal.tier", cutoff, genTierAnchorID(goalIndex));
  }

  function genGoalID(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("goal", index)));
  }

  function genContributionID(uint256 goalID, uint256 accID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("goal.contribution", goalID, accID)));
  }

  function genObjID(uint256 goalID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("goal.objective", goalID)));
  }

  function genTierAnchorID(uint32 goalIndex) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("goal.tier", goalIndex)));
  }

  /// @notice Retrieve the ID of a requirement array
  function genReqAnchor(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("goal.requirement", index)));
  }

  /// @notice Retrieve the ID of a reward array
  function genAlloAnchor(uint256 tierID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("goal.reward", tierID)));
  }
}
