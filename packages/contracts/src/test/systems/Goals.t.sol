// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";

contract GoalsTest is SetupTemplate {
  function testGoalShape() public {
    uint32 index = 1;
    uint256 goalID = _createGoal(1, 0, Condition("type", "logic", 0, 0));
    uint256 requirementID1 = _createGoalRequirement(1, Condition("type", "logic", 1, 0));
    uint256 requirementID2 = _createGoalRequirement(1, Condition("type", "logic", 2, 0));
    uint256 rewardID1 = _createGoalReward(1, 0, Condition("type", "REWARD", 1, 0));
    uint256 rewardID2 = _createGoalReward(1, 100, Condition("type", "REWARD", 2, 0));
    uint256 rewardID3 = _createGoalReward(1, 200, Condition("type", "DISPLAY_ONLY", 0, 0));
    uint256 rewardID4 = _createGoalReward(1, 200, Condition("type", "DISPLAY_ONLY", 0, 0));
    uint256 rewardID5 = _createGoalReward(1, 200, Condition("type", "DISPLAY_ONLY", 0, 0));

    vm.prank(deployer);
    __GoalRegistrySystem.remove(index);
  }

  function testGoalCoinBasic() public {
    uint32 goalIndex = 1;
    uint256 targetAmt = 1111;
    uint256 currContribAmt = 0;
    _createGenericItem(100); // reward - bronze tier
    _createGenericItem(200); // reward - silver tier
    _createGenericItem(300); // reward - gold tier
    uint256 goalID = _createGoal(
      goalIndex,
      0,
      Condition("ITEM", "CURR_MIN", MUSU_INDEX, targetAmt)
    );
    uint256 rwdBronze = _createGoalReward(goalIndex, 100, Condition("ITEM", "REWARD", 100, 1));
    uint256 rwdSilver = _createGoalReward(goalIndex, 200, Condition("ITEM", "REWARD", 200, 1));
    uint256 rwdGold = _createGoalReward(goalIndex, 300, Condition("ITEM", "REWARD", 300, 1));
    uint256 rwdDisplay = _createGoalReward(goalIndex, 0, Condition("ITEM", "DISPLAY_ONLY", 3, 1));

    /////
    // SETTING ACCOUNTS
    PlayerAccount memory accLurker = _accounts[0]; // does not contribute
    PlayerAccount memory accSlacker = _accounts[1]; // contributes a little, < bronze
    PlayerAccount memory accBronze = _accounts[2]; // contributes till bronze
    PlayerAccount memory accSilver = _accounts[3]; // contributes till silver
    PlayerAccount memory accGold = _accounts[4]; // contributes till gold

    _fundAccount(accSlacker.index, 50);
    _fundAccount(accBronze.index, 100);
    _fundAccount(accSilver.index, 200);
    _fundAccount(accGold.index, 2000);

    /////
    // CONTRIBUTIONS

    // check contribution shape; slacker contributes 50
    vm.prank(accSlacker.operator);
    _GoalContributeSystem.executeTyped(goalIndex, 50);
    currContribAmt += 50;
    _assertContribution(goalID, accSlacker.id, 50);
    assertEq(0, LibInventory.getBalanceOf(components, accSlacker.id, MUSU_INDEX));
    _assertGoalStatus(goalID, currContribAmt, false);

    // add contribution for bronze and silver (alr checked shape)
    vm.prank(accBronze.operator);
    _GoalContributeSystem.executeTyped(goalIndex, 100);
    currContribAmt += 100;
    vm.prank(accSilver.operator);
    _GoalContributeSystem.executeTyped(goalIndex, 200);
    currContribAmt += 200;

    // gold first contribution
    vm.prank(accGold.operator);
    _GoalContributeSystem.executeTyped(goalIndex, 100);
    currContribAmt += 100;

    // gold contributes, but it caps out at 1111 - 450 = 611
    vm.prank(accGold.operator);
    _GoalContributeSystem.executeTyped(goalIndex, 1000);
    currContribAmt += 611;
    _assertContribution(goalID, accGold.id, 761);
    assertEq(1239, LibInventory.getBalanceOf(components, accGold.id, MUSU_INDEX)); // 2000 - 761 = 1289
    _assertGoalStatus(goalID, 1111, true);

    // gold tries to contribute again
    vm.prank(accGold.operator);
    vm.expectRevert("cannot contribute to this goal");
    _GoalContributeSystem.executeTyped(goalIndex, 100);

    /////
    // REWARDS

    // non participator tries to claim
    vm.prank(accLurker.operator);
    vm.expectRevert("cannot claim from this goal");
    _GoalClaimSystem.executeTyped(goalIndex);

    // not-even-bronze claims, gets nothing
    vm.prank(accSlacker.operator);
    _GoalClaimSystem.executeTyped(goalIndex);
    assertEq(0, _getItemBal(accSlacker.index, 100));
    assertEq(0, _getItemBal(accSlacker.index, 200));
    assertEq(0, _getItemBal(accSlacker.index, 300));

    // bronze claims, gets bronze tier
    vm.prank(accBronze.operator);
    _GoalClaimSystem.executeTyped(goalIndex);
    assertEq(1, _getItemBal(accBronze.index, 100));
    assertEq(0, _getItemBal(accBronze.index, 200));
    assertEq(0, _getItemBal(accBronze.index, 300));

    // silver claims, gets silver tier
    vm.prank(accSilver.operator);
    _GoalClaimSystem.executeTyped(goalIndex);
    assertEq(1, _getItemBal(accSilver.index, 100));
    assertEq(1, _getItemBal(accSilver.index, 200));
    assertEq(0, _getItemBal(accSilver.index, 300));

    // gold claims, gets gold tier
    vm.prank(accGold.operator);
    _GoalClaimSystem.executeTyped(goalIndex);
    assertEq(1, _getItemBal(accGold.index, 100));
    assertEq(1, _getItemBal(accGold.index, 200));
    assertEq(1, _getItemBal(accGold.index, 300));
  }

  //////////////////
  // UTILS

  function _assertContribution(uint256 goalID, uint256 accID, uint256 amt) internal {
    uint256 contributionID = LibGoals.genContributionID(goalID, accID);
    assertEq(
      amt,
      _ValueComponent.has(contributionID) ? _ValueComponent.get(contributionID) : 0,
      "unequal account contribution"
    );
  }

  function _assertGoalStatus(uint256 goalID, uint256 amount, bool complete) internal {
    assertEq(
      amount,
      _ValueComponent.has(goalID) ? _ValueComponent.get(goalID) : 0,
      "unequal goal live amount"
    );
    assertEq(complete, _IsCompleteComponent.has(goalID), "wrong goal complete");
  }
}
