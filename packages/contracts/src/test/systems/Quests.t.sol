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

  function _assertAccNumQuests(uint256 accountID, uint256 numQuests) internal {
    assertEq(_getAccountQuests(accountID).length, numQuests);
  }

  function _getAccountQuests(uint256 accountID) internal view returns (uint256[] memory) {
    return LibQuests.queryAccountQuests(components, accountID);
  }

  function testAcceptQuest() public {
    // create quest
    _createQuest(1, "EmptyQuest", "DESCRIPTION", 0, 0);

    // register account
    _registerAccount(0);
    address operator = _getOperator(0);

    // accept quest
    uint256 questID = _acceptQuest(0, 1);
    _assertQuestAccount(_getAccount(0), questID);

    vm.prank(operator);
    vm.expectRevert("QuestAccept: accepted before");
    _QuestAcceptSystem.executeTyped(1);

    // check that quest cant be accepted over its max
    _completeQuest(0, questID);

    vm.prank(operator);
    vm.expectRevert("QuestAccept: accepted before");
    _QuestAcceptSystem.executeTyped(1);
  }

  function testRepeatableQuest() public {
    // create quest
    _createQuest(1, "EmptyQuest", "DESCRIPTION", 0, 1000);

    // register account
    _registerAccount(0);
    address operator = _getOperator(0);

    // accept quest - first time
    uint256 questID = _acceptQuest(0, 1);
    _assertQuestAccount(_getAccount(0), questID);

    // accept quest - second time, uncompleted, within time
    vm.prank(operator);
    vm.expectRevert("QuestAccept: repeat cons not met");
    _QuestAcceptSystem.executeTyped(1);

    // accept quest - second time, completed, within time
    _completeQuest(0, questID);
    vm.prank(operator);
    vm.expectRevert("QuestAccept: repeat cons not met");
    _QuestAcceptSystem.executeTyped(1);

    // accept quest - second time, completed, after time
    _fastForward(1001);
    uint256 questID2 = _acceptQuest(0, 1);

    assertEq(questID, questID2);
    _assertAccNumQuests(_getAccount(0), 1);
  }

  function testDropQuest() public {
    // create quest
    _createQuest(1, "EmptyQuest", "DESCRIPTION", 0, 0);

    // register account
    _registerAccount(0);
    address operator = _getOperator(0);

    // accept quest
    uint256 questID = _acceptQuest(0, 1);
    _assertQuestAccount(_getAccount(0), questID);

    // drop quest
    _dropQuest(0, questID);
    _assertAccNumQuests(_getAccount(0), 0);
  }

  function testQuestCoinHave() public {
    // create quest
    _createQuest(1, "BasicCoinQuest", "DESCRIPTION", 0, 0);
    _createQuestRequirement(1, "HAVE", "COIN", 0, 1);
    _createQuestObjective(1, "Quest 1", "CURR_MIN", "COIN", 0, 10);
    _createQuestReward(1, "COIN", 0, 1);

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
    _createQuest(1, "BasicCoinQuest", "DESCRIPTION", 0, 0);
    _createQuestRequirement(1, "HAVE", "COIN", 0, 1);
    _createQuestObjective(1, "NAME", "INC_MIN", "COIN_TOTAL", 0, 10);
    _createQuestReward(1, "COIN", 0, 1);

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
    _createQuest(1, "BasicLocationQuest", "DESCRIPTION", 0, 0);
    _createQuestRequirement(1, "AT", "ROOM", 0, 3);
    _createQuestObjective(1, "NAME", "CURR_EQUAL", "ROOM", 0, 4);

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

  function testMintKami() public {
    // setup for kami mint
    _createRoom("Room 1", 1, 2, 3, 4);
    _createRoom("Room 2", 2, 1, 3, 4);
    _createRoom("Room 3", 3, 1, 2, 4);
    _createRoom("Room 4", 4, 1, 2, 3);
    _initCommonTraits();

    // create quest
    _createQuest(1, "MintKamiQuest", "DESCRIPTION", 0, 0);
    _createQuestRequirement(1, "AT", "ROOM", 0, 1);
    _createQuestObjective(1, "NAME", "INC_MIN", "PET721_MINT", 0, 2);

    // register account
    _registerAccount(0);
    address operator = _getOperator(0);

    // accept quest
    uint256 questID = _acceptQuest(0, 1);
    _assertQuestAccount(_getAccount(0), questID);

    // check that quest cant be completed when failing objectives
    vm.prank(operator);
    vm.expectRevert("QuestComplete: objs not met");
    _QuestCompleteSystem.executeTyped(questID);
    _mintPet(0);
    vm.prank(operator);
    vm.expectRevert("QuestComplete: objs not met");
    _QuestCompleteSystem.executeTyped(questID);

    // check that quest can be completed when objectives met
    _mintPet(0);
    _completeQuest(0, questID);
    assertTrue(LibQuests.isCompleted(components, questID));
  }

  function testCompleteQuest() public {
    // create quest(s)
    _createQuest(1, "EmptyQuest", "DESCRIPTION", 0, 0);
    _createQuest(2, "BasicQuest", "DESCRIPTION", 0, 0);
    _createQuestRequirement(2, "COMPLETE", "QUEST", 0, 1);

    // register account
    _registerAccount(0);
    address operator = _getOperator(0);

    // check that quest cant be accepted without requirements
    vm.prank(operator);
    vm.expectRevert("QuestAccept: reqs not met");
    _QuestAcceptSystem.executeTyped(2);

    // finish required quest, accept new
    uint256 preQuestID = _acceptQuest(0, 1);
    _completeQuest(0, preQuestID);
    uint256 questID = _acceptQuest(0, 2);
    _assertQuestAccount(_getAccount(0), questID);

    // check that quest can be completed when objectives met
    _completeQuest(0, questID);
    assertTrue(LibQuests.isCompleted(components, questID));
  }

  function testRewardMint20() public {
    // create quest
    _createQuest(1, "EmptyQuest", "DESCRIPTION", 0, 0);
    _createQuestReward(1, "MINT20", 0, 2);

    // register account
    _registerAccount(0);
    address operator = _getOperator(0);

    // accept quest
    uint256 questID = _acceptQuest(0, 1);

    // check that Mint20 is properly distributed
    _completeQuest(0, questID);
    assertEq(2 * 10 ** 18, _Mint20.balanceOf(_getOwner(0)));
  }

  function testRewardPoints() public {
    // create quest
    _createQuest(1, "EmptyQuest", "DESCRIPTION", 0, 0);
    _createQuestReward(1, "QUEST_POINTS", 0, 2);

    // register account
    _registerAccount(0);
    address operator = _getOperator(0);

    // accept quest
    uint256 questID = _acceptQuest(0, 1);

    // check that Mint20 is properly distributed
    _completeQuest(0, questID);
    assertEq(LibAccount.getQuestPoints(components, _getAccount(0)), 2);
  }
}
