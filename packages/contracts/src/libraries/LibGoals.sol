// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { LibQuery } from "solecs/LibQuery.sol";

import { DescriptionComponent, ID as DescriptionCompID } from "components/DescriptionComponent.sol";
import { IDPointerComponent, ID as IDPointerCompID } from "components/IDPointerComponent.sol";
import { IsGoalComponent, ID as IsGoalCompID } from "components/IsGoalComponent.sol";
import { IsCompleteComponent, ID as IsCompleteCompID } from "components/IsCompleteComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IndexRoomComponent, ID as IndexRoomCompID } from "components/IndexRoomComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibComp } from "libraries/utils/LibComp.sol";
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
 * - Rewards (e.g. coins, items, etc)
 *   - Tiered - eg Bronze, Silver, Gold
 *     - Higher tiers also recieve lower tier rewards (eg Gold gets Gold + Silver + Bronze)
 *     - Uses LevelComp as the min contribution to qualify for a tier
 *       - eg Bronze LevelComp = 100, contribution >= 100 to qualify for Bronze
 *   - Shape: Condition + Level + Name
 *     - Condition shape handles reward type and quantity
 *     - Logic type is either "REWARD" or "DISPLAY_ONLY"
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
    IsGoalComponent(getAddressById(components, IsGoalCompID)).set(id);
    IndexComponent(getAddressById(components, IndexCompID)).set(id, index);
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
    DescriptionComponent(getAddressById(components, DescriptionCompID)).set(id, description);
    if (roomIndex != 0)
      IndexRoomComponent(getAddressById(components, IndexRoomCompID)).set(id, roomIndex);

    // adding the objective
    uint256 objID = genObjID(id);
    LibConditional.create(components, objID, objective);
  }

  /// @notice adds a requirement to a goal
  function addRequirement(
    IWorld world,
    IUintComp components,
    uint32 goalIndex,
    Condition memory requirement
  ) internal returns (uint256 id) {
    id = LibConditional.createFor(world, components, requirement, genReqPtr(goalIndex));
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
   */
  /// @param minContribution needed to qualify for tier; "DISPLAY_ONLY" do not have this
  function addReward(
    IWorld world,
    IUintComp components,
    uint32 goalIndex,
    string memory name,
    uint256 minContribution,
    string memory logic,
    string memory type_,
    uint32 index,
    uint32[] memory keys,
    uint256[] memory weights,
    uint256 value
  ) internal returns (uint256 id) {
    id = LibReward.create(
      world,
      components,
      genRwdPtr(goalIndex),
      type_,
      index,
      keys,
      weights,
      value
    );

    // custom touchs for goal rewards
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
    LogicTypeComponent(getAddressById(components, LogicTypeCompID)).set(id, logic);
    require(
      logic.eq("REWARD") || logic.eq("DISPLAY_ONLY"),
      "LibGoals: invalid reward distribution"
    );
    if (!logic.eq("DISPLAY_ONLY"))
      LevelComponent(getAddressById(components, LevelCompID)).set(id, minContribution);
  }

  function remove(IUintComp components, uint32 index) internal {
    uint256 goalID = genGoalID(index);
    IsGoalComponent(getAddressById(components, IsGoalCompID)).remove(goalID);
    IndexComponent(getAddressById(components, IndexCompID)).remove(goalID);
    NameComponent(getAddressById(components, NameCompID)).remove(goalID);
    DescriptionComponent(getAddressById(components, DescriptionCompID)).remove(goalID);
    IndexRoomComponent(getAddressById(components, IndexRoomCompID)).remove(goalID);
    IsCompleteComponent(getAddressById(components, IsCompleteCompID)).remove(goalID);

    // remove objective
    uint256 objID = genObjID(goalID);
    LibConditional.remove(components, objID);

    // remove requirements
    uint256[] memory reqIDs = getRequirements(components, index);
    for (uint256 i = 0; i < reqIDs.length; i++) removeRequirement(components, reqIDs[i]);

    // remove rewards
    uint256[] memory rewIDs = getRewards(components, index);
    for (uint256 i = 0; i < rewIDs.length; i++) removeReward(components, rewIDs[i]);
  }

  function removeRequirement(IUintComp components, uint256 id) internal {
    LibConditional.remove(components, id);
    NameComponent(getAddressById(components, NameCompID)).remove(id);
    LevelComponent(getAddressById(components, LevelCompID)).remove(id);
  }

  function removeReward(IUintComp components, uint256 id) internal {
    LibReward.remove(components, id);
    LogicTypeComponent(getAddressById(components, LogicTypeCompID)).remove(id);
    NameComponent(getAddressById(components, NameCompID)).remove(id);
    LevelComponent(getAddressById(components, LevelCompID)).remove(id);
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
    IUintComp balComp = IUintComp(getAddressById(components, ValueCompID));
    uint256 currBal = balComp.safeGetUint256(goalID);
    uint256 targetBal = balComp.safeGetUint256(objID);

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
    uint256[] memory rwdIDs = queryActiveRewards(components, goalIndex); // non DISPLAY_ONLY rewards
    filterRewardTiers(components, goalID, accID, rwdIDs); // filter out unqualified tiers

    LibReward.distribute(world, components, rwdIDs, accID);
  }

  ////////////////////
  // CHECKERS

  function canClaim(
    IUintComp components,
    uint256 goalID,
    uint256 accID
  ) internal view returns (bool) {
    if (!checkRoom(components, goalID, accID)) return false; // wrong room

    uint256 contributionID = genContributionID(goalID, accID);
    IsCompleteComponent completeComp = IsCompleteComponent(
      getAddressById(components, IsCompleteCompID)
    );
    bool goalCompleted = completeComp.has(goalID);
    bool accClaimed = completeComp.has(contributionID);

    bool accContributed = ValueComponent(getAddressById(components, ValueCompID)).has(
      contributionID
    );
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
    IndexRoomComponent comp = IndexRoomComponent(getAddressById(components, IndexRoomCompID));
    if (!comp.has(goalID)) return true; // global goal, no room needed

    return comp.get(goalID) == comp.get(accID);
  }

  /// @notice gets rewards from tiers an account can qualify for
  /// @dev filters directly on rwdIDs, unqualified returns 0
  function filterRewardTiers(
    IUintComp components,
    uint256 goalID,
    uint256 accID,
    uint256[] memory rwdIDs
  ) internal view {
    LevelComponent levelComp = LevelComponent(getAddressById(components, LevelCompID));

    uint256 contribution = getContributionAmt(components, goalID, accID);
    for (uint256 i; i < rwdIDs.length; i++)
      if (contribution < levelComp.get(rwdIDs[i])) rwdIDs[i] = 0;
  }

  function isComplete(IUintComp components, uint256 id) internal view returns (bool) {
    return IsCompleteComponent(getAddressById(components, IsCompleteCompID)).has(id);
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
    IsCompleteComponent(getAddressById(components, IsCompleteCompID)).set(id);
  }

  function setClaimed(IUintComp components, uint256 goalID, uint256 accID) internal {
    IsCompleteComponent(getAddressById(components, IsCompleteCompID)).set(
      genContributionID(goalID, accID)
    );
  }

  ////////////////////
  // GETTERS

  function getByIndex(IUintComp components, uint32 index) internal view returns (uint256) {
    uint256 id = genGoalID(index);
    return IsGoalComponent(getAddressById(components, IsGoalCompID)).has(id) ? id : 0;
  }

  function getContributionAmt(
    IUintComp components,
    uint256 goalID,
    uint256 accID
  ) internal view returns (uint256) {
    ValueComponent comp = ValueComponent(getAddressById(components, ValueCompID));
    uint256 id = genContributionID(goalID, accID);
    return comp.has(id) ? comp.get(id) : 0;
  }

  function getRequirements(
    IUintComp components,
    uint32 goalIndex
  ) internal view returns (uint256[] memory) {
    return getConditions(components, genReqPtr(goalIndex));
  }

  function getRewards(
    IUintComp components,
    uint32 goalIndex
  ) internal view returns (uint256[] memory) {
    return getConditions(components, genRwdPtr(goalIndex));
  }

  function getConditions(
    IUintComp components,
    uint256 pointer
  ) internal view returns (uint256[] memory) {
    return
      IDPointerComponent(getAddressById(components, IDPointerCompID)).getEntitiesWithValue(pointer);
  }

  ////////////////////
  // QUERIES

  /// @notice gets rewards that arent only for display using Level check
  /// @dev only active rewards have a level component (minimum contribution)
  function queryActiveRewards(
    IUintComp components,
    uint32 goalIndex
  ) internal view returns (uint256[] memory) {
    uint256 pointer = genRwdPtr(goalIndex);
    return
      LibQuery.getIsWithValue(
        getComponentById(components, IDPointerCompID),
        getComponentById(components, LevelCompID),
        abi.encode(pointer)
      );
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
  function genReqPtr(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("goal.requirement", index)));
  }

  /// @notice Retrieve the ID of a reward array
  function genRwdPtr(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("goal.reward", index)));
  }
}
