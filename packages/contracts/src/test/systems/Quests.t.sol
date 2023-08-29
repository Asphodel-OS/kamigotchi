// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

contract QuestsTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
  }

  function _assertQuestAccount(uint256 accountID, uint256 questID) internal {
    assertEq(LibQuests.getAccountId(components, questID), accountID);
  }

  function testQuestCoinHave() public {
    // create quest
    _createQuest(1, "BasicCoinQuest", "DESCRIPTION", 0);
    _createRequirement(1, "HAVE", "COIN", 0, 1);
    _createObjective(1, "Quest 1", "HAVE", "COIN", 0, 10);
    _createReward(1, "COIN", 0, 1);

    // register the account
    _registerAccount(0);
    address operator = _getOperator(0);

    // check quest cant be accepted when failing requirements
    vm.prank(operator);
    vm.expectRevert("QuestAccept: reqs not met");
    _QuestAcceptSystem.executeTyped(1);

    // give the account the required coin, check if quest assigned
    _fundAccount(0, 1);
    uint256 questID = _acceptQuest(0, 1);
    // _assertQuestAccount(_getAccount(0), questID);

    // check that quest cant be completed when failing objectives
    vm.prank(operator);
    vm.expectRevert("QuestComplete: objs not met");
    _QuestCompleteSystem.executeTyped(questID);

    // check that quest can be completed when objectives met
    _fundAccount(0, 9);
    _completeQuest(0, questID);

    // check that quest cant be completed twice
    vm.prank(operator);
    vm.expectRevert("Quests: alr completed");
    _QuestCompleteSystem.executeTyped(questID);

    // check coin reward distributed correctly
    // assertEq(LibCoin.get(components, _getAccount(0)), 11);
  }

  function testQuestCoinGather() public {
    // create quest
    _createQuest(1, "BasicCoinQuest", "DESCRIPTION", 0);
    _createRequirement(1, "HAVE", "COIN", 0, 1);
    _createObjective(1, "NAME", "GATHER", "COIN", 0, 10);
    _createReward(1, "COIN", 0, 1);

    // register account
    _registerAccount(0);
    address operator = _getOperator(0);

    // give the account the required coin, check if quest assigned
    _fundAccount(0, 1);
    uint256 questID = _acceptQuest(0, 1);
    _assertQuestAccount(_getAccount(0), questID);

    // check that quest cant be completed when failing objectives
    vm.prank(operator);
    vm.expectRevert("QuestComplete: objs not met");
    _QuestCompleteSystem.executeTyped(questID);
    _fundAccount(0, 9);
    vm.prank(operator);
    vm.expectRevert("QuestComplete: objs not met");
    _QuestCompleteSystem.executeTyped(questID);

    // check that quest can be completed when objectives met
    // and that any rewards (coin) is distributed correctly
    _fundAccount(0, 1);
    _completeQuest(0, questID);
    assertEq(LibCoin.get(components, _getAccount(0)), 12);

    // check that quest cant be completed twice
    vm.prank(operator);
    vm.expectRevert("Quests: alr completed");
    _QuestCompleteSystem.executeTyped(questID);
  }

  function testQuestLocation() public {
    // create relavent rooms
    _createRoom("Room 1", 1, 2, 3, 4);
    _createRoom("Room 2", 2, 1, 3, 4);
    _createRoom("Room 3", 3, 1, 2, 4);
    _createRoom("Room 4", 4, 1, 2, 3);

    // create quest
    _createQuest(1, "BasicLocationQuest", "DESCRIPTION", 0);
    _createRequirement(1, "AT", "ROOM", 0, 3);
    _createObjective(1, "NAME", "AT", "ROOM", 0, 4);

    // register account
    _registerAccount(0);
    address operator = _getOperator(0);

    // check that quest cant be accepted in wrong room
    vm.prank(operator);
    vm.expectRevert("QuestAccept: reqs not met");
    _QuestAcceptSystem.executeTyped(1);

    // move to correct room, accept quest
    _moveAccount(0, 3);
    uint256 questID = _acceptQuest(0, 1);
    _assertQuestAccount(_getAccount(0), questID);

    // check that quest cant be completed when failing objectives
    vm.prank(operator);
    vm.expectRevert("QuestComplete: objs not met");
    _QuestCompleteSystem.executeTyped(questID);
    _moveAccount(0, 2);
    vm.prank(operator);
    vm.expectRevert("QuestComplete: objs not met");
    _QuestCompleteSystem.executeTyped(questID);

    // check that quest can be completed when objectives met
    _moveAccount(0, 4);
    _completeQuest(0, questID);
    assertTrue(LibQuests.isCompleted(components, questID));
  }
}
