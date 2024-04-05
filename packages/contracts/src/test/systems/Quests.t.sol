// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";

import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { LibHash } from "libraries/utils/LibHash.sol";

struct DataEntity {
  uint256 holderID;
  uint32 index;
  string type_;
}

contract QuestsTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
  }

  function testRegistryCreation() public {
    uint256 expectedID = LibRegistryQuests.genQuestID(1);
    uint256 regID = _createQuest(1, 0);
    assertEq(expectedID, regID);

    uint256[] memory reqsArr = new uint256[](5);
    for (uint256 i; i < 5; i++) {
      uint256 newID = _createQuestRequirement(1, "CURR_MIN", "COIN", 0, 1);
      reqsArr[i] = newID;

      uint256[] memory newArr = LibRegistryQuests.getRequirementsByQuestIndex(components, 1);
      for (uint256 j; j <= i; j++) assertEq(newArr[j], reqsArr[j]);
    }
    assertEq(LibRegistryQuests.getRequirementsByQuestIndex(components, 1).length, 5);

    uint256[] memory objsArr = new uint256[](5);
    for (uint256 i; i < 5; i++) {
      uint256 newID = _createQuestObjective(1, "Quest 1", "CURR_MIN", "COIN_TOTAL", uint32(i), 10);
      objsArr[i] = newID;

      uint256[] memory newArr = LibRegistryQuests.getObjectivesByQuestIndex(components, 1);
      for (uint256 j; j <= i; j++) assertEq(newArr[j], objsArr[j]);
    }
    assertEq(LibRegistryQuests.getObjectivesByQuestIndex(components, 1).length, 5);

    uint256[] memory rewsArr = new uint256[](5);
    for (uint256 i; i < 5; i++) {
      uint256 newID = _createQuestReward(1, "COIN", 0, 1);
      rewsArr[i] = newID;

      uint256[] memory newArr = LibRegistryQuests.getRewardsByQuestIndex(components, 1);
      for (uint256 j; j <= i; j++) assertEq(newArr[j], rewsArr[j]);
    }
    assertEq(LibRegistryQuests.getRewardsByQuestIndex(components, 1).length, 5);
  }

  function testAcceptQuest() public {
    // create quest
    _createQuest(1, 0);

    // register account
    address operator = _getOperator(0);

    // accept quest
    uint256 questID = _acceptQuest(0, 1);
    _assertQuestAccount(_getAccount(0), questID);

    vm.prank(operator);
    vm.expectRevert("QuestAccept: accepted before");
    _QuestAcceptSystem.executeTyped(1);

    // check that quest cant be accepted more than once
    _completeQuest(0, questID);

    vm.prank(operator);
    vm.expectRevert("QuestAccept: accepted before");
    _QuestAcceptSystem.executeTyped(1);
  }

  function testRepeatableQuest() public {
    // create quest
    _createQuest(1, 1000);

    // register account
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
    _createQuest(1, 0);

    // register account
    address operator = _getOperator(0);

    // accept quest
    uint256 questID = _acceptQuest(0, 1);
    _assertQuestAccount(_getAccount(0), questID);

    // drop quest
    _dropQuest(0, questID);
    _assertAccNumQuests(_getAccount(0), 0);
  }

  function testObjectiveSnapshot(uint128 startAmt, uint128 useAmt, uint32 expIndex) public {
    vm.assume(useAmt > 0);
    DataEntity memory expData = DataEntity(_getAccount(0), expIndex, "TEST.DATA");
    string memory expLogicType = "INC_MIN";

    // initial setup
    _createQuest(1, 0);
    // _createQuestObjective(1, "TEST.OBJ", "CURR_MIN", "TEST.DATA", 0, 1);
    uint256 regObj = _createQuestObjective(
      1,
      "TEST.OBJ",
      expLogicType,
      expData.type_,
      expIndex,
      uint256(useAmt)
    );
    uint256 hashedObj = uint256(
      keccak256(abi.encode("Quest.Objective", expLogicType, expData.type_, expIndex))
    );
    if (startAmt > 0) {
      vm.startPrank(deployer);
      LibDataEntity.set(components, expData.holderID, expData.index, expData.type_, startAmt);
      vm.stopPrank();
    }

    // accept quest
    uint256 questID = _acceptQuest(0, 1);

    // check that snapshots are correctly stored
    vm.prank(deployer); // load bearing entity lol
    _IdOwnsQuestComponent.set(1, 1); // load bearing entity lol
    uint256[] memory snapshots = _getQuestObjSnapshots(questID);
    assertEq(snapshots.length, 1);
    assertTrue(_IsObjectiveComponent.has(snapshots[0]));
    assertEq(_IdOwnsQuestComponent.get(snapshots[0]), questID);
    assertEq(_BalanceComponent.get(snapshots[0]), startAmt);

    // check completability
    assertTrue(!LibQuests.checkObjectives(components, questID, _getAccount(0)));
    vm.startPrank(deployer);
    LibDataEntity.inc(components, expData.holderID, expData.index, expData.type_, useAmt);
    vm.stopPrank();
    assertTrue(LibQuests.checkObjectives(components, questID, _getAccount(0)));

    // complete, check snapshots deleted
    _completeQuest(0, questID);
    assertEq(_getQuestObjSnapshots(questID).length, 0);
  }

  function testQuestCoinHave() public {
    // create quest
    _createQuest(1, 0);
    _createQuestRequirement(1, "CURR_MIN", "COIN", 0, 1);
    _createQuestObjective(1, "Quest 1", "CURR_MIN", "COIN", 0, 10);
    _createQuestReward(1, "COIN", 0, 1);

    // register the account
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
    vm.expectRevert("Quest: objs not met");
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
    _createQuest(1, 0);
    _createQuestRequirement(1, "CURR_MIN", "COIN", 0, 1);
    _createQuestObjective(1, "NAME", "INC_MIN", "COIN_TOTAL", 0, 10);
    _createQuestReward(1, "COIN", 0, 1);

    // register account
    address operator = _getOperator(0);

    // give the account the required coin, check if quest assigned
    _fundAccount(0, 1);
    uint256 questID = _acceptQuest(0, 1);
    _assertQuestAccount(_getAccount(0), questID);

    // check that quest cant be completed when failing objectives
    vm.prank(operator);
    vm.expectRevert("Quest: objs not met");
    _QuestCompleteSystem.executeTyped(questID);
    _fundAccount(0, 9);
    vm.prank(operator);
    vm.expectRevert("Quest: objs not met");
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

  function testQuestCompleted() public {
    // create quest
    _createQuest(1, 0);
    _createQuest(2, 0);
    _createQuestRequirement(2, "BOOL_IS", "QUEST", 1, 0);

    // register the account
    address operator = _getOperator(0);

    // check quest cant be accepted when failing requirements
    vm.prank(operator);
    vm.expectRevert("QuestAccept: reqs not met");
    _QuestAcceptSystem.executeTyped(2);
    uint256 reqQuest = _acceptQuest(0, 1);
    vm.prank(operator);
    vm.expectRevert("QuestAccept: reqs not met");
    _QuestAcceptSystem.executeTyped(2);

    // fufill requirements
    _completeQuest(0, reqQuest);

    // accept quest
    uint256 questID = _acceptQuest(0, 2);
    _assertQuestAccount(_getAccount(0), questID);
    _completeQuest(0, questID);
  }

  function testQuestRoomIndex() public {
    // create quest
    _createQuest(1, 0);
    _createQuestRequirement(1, "BOOL_IS", "ROOM", 3, 0);
    _createQuestObjective(1, "NAME", "BOOL_IS", "ROOM", 4, 0);

    // register account
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
    vm.expectRevert("Quest: objs not met");
    _QuestCompleteSystem.executeTyped(questID);
    _moveAccount(0, 2);
    vm.prank(operator);
    vm.expectRevert("Quest: objs not met");
    _QuestCompleteSystem.executeTyped(questID);

    // check that quest can be completed when objectives met
    _moveAccount(0, 4);
    _completeQuest(0, questID);
    assertTrue(LibQuests.isCompleted(components, questID));
  }

  function testMintKami() public {
    // create quest
    _createQuest(1, 0);
    _createQuestRequirement(1, "BOOL_IS", "ROOM", 1, 0);
    _createQuestObjective(1, "NAME", "INC_MIN", "PET721_MINT", 0, 2);

    // register account
    address operator = _getOperator(0);

    // accept quest
    uint256 questID = _acceptQuest(0, 1);
    _assertQuestAccount(_getAccount(0), questID);

    // check that quest cant be completed when failing objectives
    vm.prank(operator);
    vm.expectRevert("Quest: objs not met");
    _QuestCompleteSystem.executeTyped(questID);
    _mintPet(0);
    vm.prank(operator);
    vm.expectRevert("Quest: objs not met");
    _QuestCompleteSystem.executeTyped(questID);

    // check that quest can be completed when objectives met
    _mintPet(0);
    _completeQuest(0, questID);
    assertTrue(LibQuests.isCompleted(components, questID));
  }

  function testCompleteQuest() public {
    // create quest(s)
    _createQuest(1, 0);
    _createQuest(2, 0);
    _createQuestRequirement(2, "BOOL_IS", "QUEST", 1, 0);

    // register account
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
    _createQuest(1, 0);
    _createQuestReward(1, "MINT20", 0, 2);

    // accept quest
    uint256 questID = _acceptQuest(0, 1);

    // check that Mint20 is properly distributed
    _completeQuest(0, questID);
    assertEq(2 * 10 ** 18, _Mint20.balanceOf(_getOwner(0)));
  }

  function testRewardPoints() public {
    // create quest
    _createQuest(1, 2, 0);

    uint256 regID = LibRegistryQuests.getByQuestIndex(components, 1);
    assertTrue(regID != 0);
    assertEq(_QuestPointComponent.get(regID), 2);
    assertEq(LibQuests.getPoints(components, regID), 2);

    // accept quest
    uint256 questID = _acceptQuest(0, 1);

    _completeQuest(0, questID);
    assertEq(LibAccount.getQuestPoints(components, _getAccount(0)), 2);
  }

  //////////////////
  // ASSERTIONS

  function _assertQuestAccount(uint256 accountID, uint256 questID) internal {
    assertEq(LibQuests.getOwner(components, questID), accountID);
  }

  function _assertAccNumQuests(uint256 accountID, uint256 numQuests) internal {
    assertEq(_getAccountQuests(accountID).length, numQuests);
  }

  ////////////////
  // UTILS

  function _getDataID(DataEntity memory data) internal view returns (uint256) {
    return LibDataEntity.getID(data.holderID, data.index, data.type_);
  }

  function _getQuestObjSnapshots(uint256 questID) internal view returns (uint256[] memory) {
    return
      LibQuery.getIsWithValue(
        getComponentById(components, IdOwnsQuestComponentID),
        getComponentById(components, IsObjectiveComponentID),
        abi.encode(questID)
      );
  }

  function _getAccountQuests(uint256 accountID) internal view returns (uint256[] memory) {
    return
      LibQuery.getIsWithValue(
        getComponentById(components, IdOwnsQuestComponentID),
        getComponentById(components, IsQuestComponentID),
        abi.encode(accountID)
      );
  }
}
