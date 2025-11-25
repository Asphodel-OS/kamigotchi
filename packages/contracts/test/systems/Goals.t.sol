// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

contract GoalsTest is SetupTemplate {
  PlayerAccount accLurker;
  PlayerAccount accSlacker;
  PlayerAccount accBronze;
  PlayerAccount accSilver;
  PlayerAccount accGold;

  function setUp() public override {
    super.setUp();

    accLurker = _accounts[0]; // does not contribute
    accSlacker = _accounts[1]; // contributes a little, < bronze
    accBronze = _accounts[2]; // contributes till bronze
    accSilver = _accounts[3]; // contributes till silver
    accGold = _accounts[4]; // contributes till gold
  }

  function testGoalShape() public {
    uint32 goalIndex = 1;
    uint256 goalID = _createGoal(1, 0, Condition("type", "logic", 0, 0, ""));
    uint256 requirementID1 = _createGoalRequirement(1, Condition("type", "logic", 1, 0, ""));
    uint256 requirementID2 = _createGoalRequirement(1, Condition("type", "logic", 2, 0, ""));
    uint256 rewardID1 = _createGoalRewardBasic(1, 100, "type", 1, 0);
    uint256 rewardID2 = _createGoalRewardBasic(1, 200, "type", 2, 0);
    uint256 rewardID3 = _createGoalRewardDisplay(1, "name");
    uint256 rewardID4 = _createGoalRewardDisplay(1, "name");
    uint256 rewardID5 = _createGoalRewardDisplay(1, "name");

    // checking tiers
    uint256[] memory tiers = LibGoal.getTiers(components, goalIndex);
    assertEq(tiers.length, 3, "wrong tier count");
    uint256[] memory rewards = LibGoal.getRewards(components, tiers);
    assertEq(rewards.length, 5, "wrong reward count");

    vm.prank(deployer);
    __GoalRegistrySystem.remove(goalIndex);
  }

  function testGoalCoinBasic() public {
    uint32 goalIndex = 1;
    uint256 targetAmt = 1111;
    uint256 currContribAmt = 0;
    _createGenericItem(100); // reward - bronze tier
    _createGenericItem(200); // reward - silver tier
    _createGenericItem(300); // reward - gold tier
    _createGenericItem(400); // reward - proportional
    uint256 goalID = _createGoal(
      goalIndex,
      0,
      Condition("ITEM", "CURR_MIN", MUSU_INDEX, targetAmt, "")
    );
    _createGoalRewardBasic(goalIndex, 100, "ITEM", 100, 1); // bronze tier
    _createGoalRewardBasic(goalIndex, 200, "ITEM", 200, 1); // silver tier
    _createGoalRewardBasic(goalIndex, 300, "ITEM", 300, 1); // gold tier
    _createGoalRewardDisplay(goalIndex, "name"); // display only
    _createGoalRewardBasic(goalIndex, 0, "ITEM", 400, 3); // proportional

    _fundAccount(accSlacker.index, 50);
    _fundAccount(accBronze.index, 100);
    _fundAccount(accSilver.index, 200);
    _fundAccount(accGold.index, 2000);

    /////
    // CONTRIBUTIONS

    // check contribution shape; slacker contributes 50
    vm.prank(accSlacker.operator);
    uint256 slackerContrib = 50;
    _GoalContributeSystem.executeTyped(goalIndex, slackerContrib);
    currContribAmt += slackerContrib;
    _assertContribution(goalID, accSlacker.id, slackerContrib);
    assertEq(0, LibInventory.getBalanceOf(components, accSlacker.id, MUSU_INDEX));
    _assertGoalStatus(goalID, currContribAmt, false);

    // add contribution for bronze and silver (alr checked shape)
    vm.prank(accBronze.operator);
    uint256 bronzeContrib = 100;
    _GoalContributeSystem.executeTyped(goalIndex, bronzeContrib);
    currContribAmt += bronzeContrib;
    vm.prank(accSilver.operator);
    uint256 silverContrib = 200;
    _GoalContributeSystem.executeTyped(goalIndex, silverContrib);
    currContribAmt += silverContrib;

    // gold first contribution
    vm.prank(accGold.operator);
    uint256 goldContrib = 100;
    _GoalContributeSystem.executeTyped(goalIndex, goldContrib);
    currContribAmt += goldContrib;

    // gold contributes, but it caps out at 1111 - 450 = 661
    vm.prank(accGold.operator);
    _GoalContributeSystem.executeTyped(goalIndex, 1000);
    currContribAmt += 661;
    goldContrib += 661;
    _assertContribution(goalID, accGold.id, goldContrib);
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

    {
      // not-even-bronze claims, gets only proportional rewards
      uint256[] memory claimableTiers = LibGoal.getClaimableTiers(
        components,
        goalIndex,
        LibGoal.getContributionAmt(components, goalID, accSlacker.id)
      );
      assertEq(4, claimableTiers.length, "claimable tiers mismatch");
      for (uint256 i; i < claimableTiers.length; i++) assertEq(claimableTiers[i], 0);
      uint256[] memory rewards = LibGoal.getRewards(components, claimableTiers);
      assertEq(0, rewards.length, "slacker rewards mismatch");
      vm.prank(accSlacker.operator);
      _GoalClaimSystem.executeTyped(goalIndex);
      assertEq(0, _getItemBal(accSlacker, 100), "slacker bronze mismatch");
      assertEq(0, _getItemBal(accSlacker, 200), "slacker silver mismatch");
      assertEq(0, _getItemBal(accSlacker, 300), "slacker gold mismatch");
      assertEq(slackerContrib * 3, _getItemBal(accSlacker, 400), "slacker proportional mismatch");
    }

    {
      // bronze claims, gets bronze tier
      uint256[] memory claimableTiers = LibGoal.getClaimableTiers(
        components,
        goalIndex,
        LibGoal.getContributionAmt(components, goalID, accBronze.id)
      );
      uint256[] memory rewards = LibGoal.getRewards(components, claimableTiers);
      assertEq(1, rewards.length, "bronzer rewards mismatch");
      vm.prank(accBronze.operator);
      _GoalClaimSystem.executeTyped(goalIndex);
      assertEq(1, _getItemBal(accBronze, 100), "bronzer bronze mismatch");
      assertEq(0, _getItemBal(accBronze, 200), "bronzer silver mismatch");
      assertEq(0, _getItemBal(accBronze, 300), "bronzer gold mismatch");
      assertEq(bronzeContrib * 3, _getItemBal(accBronze, 400), "bronzer proportional mismatch");
    }

    {
      // silver claims, gets silver tier
      uint256[] memory claimableTiers = LibGoal.getClaimableTiers(
        components,
        goalIndex,
        LibGoal.getContributionAmt(components, goalID, accSilver.id)
      );
      uint256[] memory rewards = LibGoal.getRewards(components, claimableTiers);
      assertEq(2, rewards.length, "silverer rewards mismatch");
      vm.prank(accSilver.operator);
      _GoalClaimSystem.executeTyped(goalIndex);
      assertEq(1, _getItemBal(accSilver, 100), "silverer bronze mismatch");
      assertEq(1, _getItemBal(accSilver, 200), "silverer silver mismatch");
      assertEq(0, _getItemBal(accSilver, 300), "silverer gold mismatch");
      assertEq(silverContrib * 3, _getItemBal(accSilver, 400), "silverer proportional mismatch");
    }

    {
      // gold claims, gets gold tier
      uint256[] memory claimableTiers = LibGoal.getClaimableTiers(
        components,
        goalIndex,
        LibGoal.getContributionAmt(components, goalID, accGold.id)
      );
      uint256[] memory rewards = LibGoal.getRewards(components, claimableTiers);
      assertEq(3, rewards.length, "goldier rewards mismatch");
      vm.prank(accGold.operator);
      _GoalClaimSystem.executeTyped(goalIndex);
      assertEq(1, _getItemBal(accGold, 100), "goldier bronze mismatch");
      assertEq(1, _getItemBal(accGold, 200), "goldier silver mismatch");
      assertEq(1, _getItemBal(accGold, 300), "goldier gold mismatch");
      assertEq(goldContrib * 3, _getItemBal(accGold, 400), "goldier proportional mismatch");
    }
  }

  //////////////////
  // UTILS

  function _assertContribution(uint256 goalID, uint256 accID, uint256 amt) internal {
    uint256 contributionID = LibGoal.genContributionID(goalID, accID);
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
