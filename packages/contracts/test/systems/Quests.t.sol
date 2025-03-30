// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

struct DataEntity {
  uint256 holderID;
  uint32 index;
  string type_;
}

contract QuestsTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
  }

  function testQuestShape() public {
    uint256 expectedID = LibQuestRegistry.genQuestID(1);
    uint256 regID = _createQuest(1, 0);
    assertEq(expectedID, regID);

    uint256[] memory reqsArr = new uint256[](5);
    for (uint256 i; i < 5; i++) {
      uint256 newID = _createQuestRequirement(1, "CURR_MIN", "ITEM", uint32(i + 1), 1);
      reqsArr[i] = newID;

      uint256[] memory newArr = LibQuestRegistry.getReqsByIndex(components, 1);
      for (uint256 j; j <= i; j++) assertEq(newArr[j], reqsArr[j]);
    }
    assertEq(LibQuestRegistry.getReqsByIndex(components, 1).length, 5);

    uint256[] memory objsArr = new uint256[](5);
    for (uint256 i; i < 5; i++) {
      uint256 newID = _createQuestObjective(
        1,
        "Quest 1",
        "CURR_MIN",
        "ITEM_TOTAL",
        uint32(i + 1),
        10
      );
      objsArr[i] = newID;

      uint256[] memory newArr = LibQuestRegistry.getObjsByIndex(components, 1);
      for (uint256 j; j <= i; j++) assertEq(newArr[j], objsArr[j]);
    }
    assertEq(LibQuestRegistry.getObjsByIndex(components, 1).length, 5);

    uint256[] memory rewsArr = new uint256[](5);
    for (uint256 i; i < 5; i++) {
      uint256 newID = _createQuestReward(1, "ITEM", uint32(i + 1), 1);
      rewsArr[i] = newID;

      uint256[] memory newArr = LibQuestRegistry.getRwdsByIndex(components, 1);
      for (uint256 j; j <= i; j++) assertEq(newArr[j], rewsArr[j]);
    }
    assertEq(LibQuestRegistry.getRwdsByIndex(components, 1).length, 5);
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
    vm.expectRevert("accepted before");
    _QuestAcceptSystem.executeTyped(1);

    // check that quest cant be accepted more than once
    _completeQuest(0, questID);

    vm.prank(operator);
    vm.expectRevert("accepted before");
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
    vm.expectRevert("repeat cons not met");
    _QuestAcceptSystem.executeTyped(1);

    // accept quest - second time, completed, within time
    _completeQuest(0, questID);
    vm.prank(operator);
    vm.expectRevert("repeat cons not met");
    _QuestAcceptSystem.executeTyped(1);

    // accept quest - second time, completed, after time
    _fastForward(1001);
    uint256 questID2 = _acceptQuest(0, 1);
    assertEq(questID, questID2);
    _assertAccNumQuests(_getAccount(0), 1);
    _completeQuest(0, questID);

    // accept quest - third time, completed, within time
    vm.prank(operator);
    vm.expectRevert("repeat cons not met");
    _QuestAcceptSystem.executeTyped(1);

    // accept quest - third time, completed, after time
    _fastForward(1001);
    uint256 questID3 = _acceptQuest(0, 1);
    assertEq(questID, questID3);
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
      LibData.set(components, expData.holderID, expData.index, expData.type_, startAmt);
      vm.stopPrank();
    }

    // accept quest
    uint256 questID = _acceptQuest(0, 1);

    // check that snapshots are correctly stored
    uint256[] memory snapshots = LibQuests.querySnapshottedObjectives(components, questID);
    assertEq(snapshots.length, 1, "original snapshot length mismatch");
    assertEq(_IDAnchorComponent.get(snapshots[0]), LibQuests.genSnapshotAnchor(questID));
    assertEq(_ValueComponent.get(snapshots[0]), startAmt, "original snapshot value mismatch");

    // check completability
    assertTrue(!LibQuests.checkObjectives(components, questID, _getAccount(0)));
    vm.startPrank(deployer);
    LibData.inc(components, expData.holderID, expData.index, expData.type_, useAmt);
    vm.stopPrank();
    assertTrue(LibQuests.checkObjectives(components, questID, _getAccount(0)));

    // complete, check snapshots deleted
    _completeQuest(0, questID);
    assertEq(LibQuests.querySnapshottedObjectives(components, questID).length, 0);
  }

  function testQuestCoinHave() public {
    // create quest
    _createQuest(1, 0);
    _createQuestRequirement(1, "CURR_MIN", "ITEM", 1, 1);
    _createQuestObjective(1, "CURR_MIN", "ITEM", 1, 10);
    _createQuestReward(1, "ITEM", 1, 1);

    // register the account
    address operator = _getOperator(0);

    // check quest cant be accepted when failing requirements
    vm.prank(operator);
    vm.expectRevert("reqs not met");
    _QuestAcceptSystem.executeTyped(1);

    // give the account the required coin, check if quest assigned
    _fundAccount(0, 1);
    uint256 questID = _acceptQuest(0, 1);
    // _assertQuestAccount(_getAccount(0), questID);

    // check that quest cant be completed when failing objectives
    vm.prank(operator);
    vm.expectRevert("quest objs not met");
    _QuestCompleteSystem.executeTyped(questID);

    // check that quest can be completed when objectives met
    _fundAccount(0, 9);
    _completeQuest(0, questID);

    // check that quest cant be completed twice
    vm.prank(operator);
    vm.expectRevert("quest alr completed");
    _QuestCompleteSystem.executeTyped(questID);
  }

  function testQuestCoinGather() public {
    // create quest
    _createQuest(1, 0);
    _createQuestRequirement(1, "CURR_MIN", "ITEM", 1, 1);
    _createQuestObjective(1, "NAME", "INC_MIN", "ITEM_TOTAL", 1, 10);
    _createQuestReward(1, "ITEM", 1, 1);

    // register account
    address operator = _getOperator(0);

    // give the account the required coin, check if quest assigned
    _fundAccount(0, 1);
    uint256 questID = _acceptQuest(0, 1);
    _assertQuestAccount(_getAccount(0), questID);

    // check that quest cant be completed when failing objectives
    vm.prank(operator);
    vm.expectRevert("quest objs not met");
    _QuestCompleteSystem.executeTyped(questID);
    _fundAccount(0, 9);
    vm.prank(operator);
    vm.expectRevert("quest objs not met");
    _QuestCompleteSystem.executeTyped(questID);

    // check that quest can be completed when objectives met
    // and that any rewards (coin) is distributed correctly
    _fundAccount(0, 1);
    _completeQuest(0, questID);
    assertEq(LibInventory.getBalanceOf(components, _getAccount(0), MUSU_INDEX), 12);

    // check that quest cant be completed twice
    vm.prank(operator);
    vm.expectRevert("quest alr completed");
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
    vm.expectRevert("reqs not met");
    _QuestAcceptSystem.executeTyped(2);
    uint256 reqQuest = _acceptQuest(0, 1);
    vm.prank(operator);
    vm.expectRevert("reqs not met");
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
    vm.expectRevert("reqs not met");
    _QuestAcceptSystem.executeTyped(1);

    // move to correct room, accept quest
    _moveAccount(0, 3);
    uint256 questID = _acceptQuest(0, 1);
    _assertQuestAccount(_getAccount(0), questID);

    // check that quest cant be completed when failing objectives
    vm.prank(operator);
    vm.expectRevert("quest objs not met");
    _QuestCompleteSystem.executeTyped(questID);
    _moveAccount(0, 2);
    vm.prank(operator);
    vm.expectRevert("quest objs not met");
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
    _createQuestObjective(1, "NAME", "INC_MIN", "KAMI_GACHA_MINT", 0, 2);

    // register account
    address operator = _getOperator(0);

    // accept quest
    uint256 questID = _acceptQuest(0, 1);
    _assertQuestAccount(_getAccount(0), questID);

    // check that quest cant be completed when failing objectives
    vm.prank(operator);
    vm.expectRevert("quest objs not met");
    _QuestCompleteSystem.executeTyped(questID);
    _mintKami(0);
    vm.prank(operator);
    vm.expectRevert("quest objs not met");
    _QuestCompleteSystem.executeTyped(questID);

    // check that quest can be completed when objectives met
    _mintKami(0);
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
    vm.expectRevert("reqs not met");
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

  function testRewardFaction() public {
    // create quest
    _createQuest(1, 0);
    _createQuestReward(1, "REPUTATION", 1, 111);

    // accept and complete quest
    uint256 questID = _acceptQuest(alice.index, 1);
    _completeQuest(alice.index, questID);

    // check REPUTATION
    assertEq(LibFactions.getRep(components, alice.id, 1), 111);
  }

  //////////////////
  // ASSERTIONS

  function _assertQuestAccount(uint256 accID, uint256 questID) internal {
    assertEq(_IDOwnsQuestComponent.get(questID), accID);
  }

  function _assertAccNumQuests(uint256 accID, uint256 numQuests) internal {
    assertEq(_getAccountQuests(accID).length, numQuests);
  }

  ////////////////
  // UTILS

  function _getDataID(DataEntity memory data) internal view returns (uint256) {
    return LibData.getID(data.holderID, data.index, data.type_);
  }

  function _getAccountQuests(uint256 accID) internal view returns (uint256[] memory) {
    return
      LibEntityType.queryWithValue(
        components,
        "QUEST",
        getCompByID(components, IDOwnsQuestComponentID),
        abi.encode(accID)
      );
  }
}
