// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";

contract GoalsTest is SetupTemplate {
  function testCreateGoal() public {
    uint32 index = 1;
    uint256 goalID = _createGoal(1, 0, Condition("type", "logic", 0, 0));
    uint256 requirementID1 = _createGoalRequirement(1, Condition("type", "logic", 0, 0));
    uint256 requirementID2 = _createGoalRequirement(1, Condition("type", "logic", 0, 0));
    uint256 rewardID1 = _createGoalReward(1, Condition("type", "EQUAL", 0, 0));
    uint256 rewardID2 = _createGoalReward(1, Condition("type", "PROPORTIONAL", 0, 0));

    vm.prank(deployer);
    __GoalDeleteSystem.executeTyped(index);
  }

  function testGoalCoinBasic() public {
    uint32 goalIndex = 1;
    uint256 targetAmt = 1111;
    uint256 currContribAmt = 0;
    _createGenericItem(1); // reward - every contributer gets 1
    _createGenericItem(2); // reward - gets based on contribution
    uint256 goalID = _createGoal(goalIndex, 0, Condition("COIN", "CURR_MIN", 0, targetAmt));
    uint256 rewardEqID = _createGoalReward(goalIndex, Condition("ITEM", "EQUAL", 1, 1));
    uint256 rewardPropID = _createGoalReward(
      goalIndex,
      Condition("ITEM", "PROPORTIONAL", 2, targetAmt)
    );
    _fundAccount(alice.index, 100);
    _fundAccount(bob.index, 2000);

    /////
    // CONTRIBUTIONS

    // alice contributes 100
    vm.prank(alice.operator);
    _GoalContributeSystem.executeTyped(goalIndex, 100);
    currContribAmt += 100;
    _assertContribution(goalID, alice.id, currContribAmt);
    assertEq(0, _CoinComponent.get(alice.id));
    _assertGoalStatus(goalID, currContribAmt, false);

    // bob first contributes another 100
    vm.prank(bob.operator);
    _GoalContributeSystem.executeTyped(goalIndex, 100);
    currContribAmt += 100;
    _assertContribution(goalID, bob.id, 100);
    assertEq(1900, _CoinComponent.get(bob.id));
    _assertGoalStatus(goalID, currContribAmt, false);

    // bob contributes the rest, but it caps out at 1111 - 200 = 911
    vm.prank(bob.operator);
    _GoalContributeSystem.executeTyped(goalIndex, 1900);
    _assertContribution(goalID, bob.id, 1011);
    assertEq(989, _CoinComponent.get(bob.id)); // 2000 - 1011 = 989
    _assertGoalStatus(goalID, 1111, true);

    // bob tries to contribute again
    vm.prank(bob.operator);
    vm.expectRevert("cannot contribute to this goal");
    _GoalContributeSystem.executeTyped(goalIndex, 100);

    /////
    // REWARDS

    // alice claims rewards
    vm.prank(alice.operator);
    _GoalClaimSystem.executeTyped(goalIndex);
    assertEq(1, _getItemBalance(alice.index, 1), "equal reward dist mismatch"); // equally rewarded
    assertEq(100, _getItemBalance(alice.index, 2), "proportional reward dist mismatch"); // proportional rewarded

    // bob claims rewards
    vm.prank(bob.operator);
    _GoalClaimSystem.executeTyped(goalIndex);
    assertEq(1, _getItemBalance(bob.index, 1), "equal reward dist mismatch"); // equally rewarded
    assertEq(1011, _getItemBalance(bob.index, 2), "proportional reward dist mismatch"); // proportional rewarded

    // bob tries to claim again
    vm.prank(bob.operator);
    vm.expectRevert("cannot claim from this goal");
    _GoalClaimSystem.executeTyped(goalIndex);
  }

  //////////////////
  // UTILS

  function _assertContribution(uint256 goalID, uint256 accID, uint256 amt) internal {
    uint256 contributionID = LibGoals.genContributionID(goalID, accID);
    assertEq(
      amt,
      _BalanceComponent.has(contributionID) ? _BalanceComponent.get(contributionID) : 0,
      "unequal account contribution"
    );
  }

  function _assertGoalStatus(uint256 goalID, uint256 amount, bool complete) internal {
    assertEq(
      amount,
      _BalanceComponent.has(goalID) ? _BalanceComponent.get(goalID) : 0,
      "unequal goal live amount"
    );
    assertEq(complete, _IsCompleteComponent.has(goalID), "wrong goal complete");
  }
}
