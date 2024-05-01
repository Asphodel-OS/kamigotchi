// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { BalanceComponent, ID as BalCompID } from "components/BalanceComponent.sol";
import { DescriptionComponent, ID as DescriptionCompID } from "components/DescriptionComponent.sol";
import { IdOwnsConditionComponent, ID as IdOwnsCondCompID } from "components/IdOwnsConditionComponent.sol";
import { IsGoalComponent, ID as IsGoalCompID } from "components/IsGoalComponent.sol";
import { IsRequirementComponent, ID as IsRequirementCompID } from "components/IsRequirementComponent.sol";
import { IsRewardComponent, ID as IsRewardCompID } from "components/IsRewardComponent.sol";
import { IsCompleteComponent, ID as IsCompleteCompID } from "components/IsCompleteComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IndexRoomComponent, ID as IndexRoomCompID } from "components/IndexRoomComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibComp } from "libraries/utils/LibComp.sol";
import { Condition, LibBoolean } from "libraries/utils/LibBoolean.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibScore } from "libraries/LibScore.sol";

/**
 * @notice LibGoals handles goals - a community quests that can be contributed to by many players
 *
 * Goals are made of
 * - Details (room, name, description, etc)
 * - Objectives (targets to be achieved, e.g. reach a certain amount of coins)
 *   - Objectives are mapped 1 to 1 with a Goal;
 *   - to achieve a Goal with multiple objectives, create multiple Goals
 * - Requirements (generic account requirements via LibBoolean)
 * - Rewards (e.g. coins, items, etc)
 *   - Rewards are lazily distributed depending on Quest Contribution
 * - Balance
 *   - Stores current goal progress
 *
 * Contributing to goals results in a Contribution Entity (goal+account)
 * - Contributions uses LibScore to track points for leaderboard compatibility
 *   - epoch is not used
 * - stores Contribution Points in BalanceComponent (via score)
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
    LibBoolean.create(components, objID, objective);
  }

  /// @notice adds a requirement to a goal
  function addRequirement(
    IWorld world,
    IUintComp components,
    uint32 goalIndex,
    Condition memory requirement
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    IdOwnsConditionComponent(getAddressById(components, IdOwnsCondCompID)).set(
      id,
      genReqPtr(goalIndex)
    );

    IsRequirementComponent(getAddressById(components, IsRequirementCompID)).set(id);
    LibBoolean.create(components, id, requirement);
  }

  /// @notice adds a reward to a goal
  /// @dev rewards are either split according to contribution %, or given out equally
  /// @dev piggybacks off LibBoolean. reward.logic is either "PROPORTIONAL", "EQUAL", or "DISPLAY_ONLY"
  function addReward(
    IWorld world,
    IUintComp components,
    uint32 goalIndex,
    Condition memory reward
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    IdOwnsConditionComponent(getAddressById(components, IdOwnsCondCompID)).set(
      id,
      genRwdPtr(goalIndex)
    );

    IsRewardComponent(getAddressById(components, IsRewardCompID)).set(id);
    require(
      reward.logic.eq("PROPORTIONAL") ||
        reward.logic.eq("EQUAL") ||
        reward.logic.eq("DISPLAY_ONLY"),
      "LibGoals: invalid reward distribution"
    );
    LibBoolean.create(components, id, reward);
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
    LibBoolean.unsetAll(components, objID);

    // remove requirements
    uint256[] memory reqIDs = getRequirements(components, index);
    for (uint256 i = 0; i < reqIDs.length; i++) {
      LibBoolean.unsetAll(components, reqIDs[i]);
      IdOwnsConditionComponent(getAddressById(components, IdOwnsCondCompID)).remove(reqIDs[i]);
    }

    // remove rewards
    uint256[] memory rewIDs = getRewards(components, index);
    for (uint256 i = 0; i < rewIDs.length; i++) {
      LibBoolean.unsetAll(components, rewIDs[i]);
      IdOwnsConditionComponent(getAddressById(components, IdOwnsCondCompID)).remove(rewIDs[i]);
    }
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
    IUintComp balComp = IUintComp(getAddressById(components, BalCompID));
    uint256 currBal = balComp.safeGetUint256(goalID);
    uint256 targetBal = balComp.safeGetUint256(objID);

    // cap contribution to target balance
    if (currBal + amt >= targetBal) {
      // goal completed, set it so
      amt = targetBal - currBal;
      setComplete(components, goalID);
    }

    // dec account's balance
    string memory type_ = LibBoolean.getType(components, objID);
    uint32 index = LibBoolean.getIndex(components, objID);
    LibAccount.decBalanceOf(components, accID, type_, index, amt);

    // inc goal's balance & inc account contribution
    balComp.set(goalID, currBal + amt);
    incContribution(components, accID, goalID, amt);

    return amt;
  }

  /// @notice distributes rewards
  function distributeRewards(
    IWorld world,
    IUintComp components,
    uint256 goalID,
    uint256 accID,
    uint256[] memory rewardIDs
  ) internal {
    TypeComponent typeComp = TypeComponent(getAddressById(components, TypeCompID));
    LogicTypeComponent logicComp = LogicTypeComponent(getAddressById(components, LogicTypeCompID));
    IndexComponent indexComp = IndexComponent(getAddressById(components, IndexCompID));
    BalanceComponent balComp = BalanceComponent(getAddressById(components, BalCompID));

    for (uint256 i; i < rewardIDs.length; i++) {
      distributeReward(
        world,
        components,
        goalID,
        accID,
        Condition(
          typeComp.get(rewardIDs[i]),
          logicComp.get(rewardIDs[i]),
          indexComp.has(rewardIDs[i]) ? indexComp.get(rewardIDs[i]) : 0,
          balComp.has(rewardIDs[i]) ? balComp.get(rewardIDs[i]) : 0
        )
      );
    }
  }

  function distributeReward(
    IWorld world,
    IUintComp components,
    uint256 goalID,
    uint256 accID,
    Condition memory reward
  ) internal {
    if (reward.logic.eq("DISPLAY_ONLY")) return;
    if (reward.logic.eq("PROPORTIONAL")) {
      // gets proportional amount based on contribution
      BalanceComponent balComp = BalanceComponent(getAddressById(components, BalCompID));
      uint256 total = balComp.get(goalID);
      uint256 contribution = balComp.get(genContributionID(goalID, accID));
      reward.value = (reward.value * contribution) / total;
    }
    LibAccount.incBalanceOf(world, components, accID, reward.type_, reward.index, reward.value);
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

    bool accContributed = BalanceComponent(getAddressById(components, BalCompID)).has(
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
    return LibBoolean.checkConditions(components, requirements, accID);
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
    LibScore.inc(components, id, holderID, goalID, amt);
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
      IdOwnsConditionComponent(getAddressById(components, IdOwnsCondCompID)).getEntitiesWithValue(
        pointer
      );
  }

  ////////////////////
  // LOGGING

  /// @notice log overall goal contirbution, not specific goal
  function logContribution(IUintComp components, uint256 accountID, uint256 amt) internal {
    LibDataEntity.inc(components, accountID, 0, "GOAL_CONTRIBUTION", amt);
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
