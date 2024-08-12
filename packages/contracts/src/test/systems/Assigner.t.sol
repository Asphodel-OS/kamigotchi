// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";

// this test experience gain, leveling and all expected effects due to leveling
contract AssignerTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
  }

  function setUpItems() public override {}

  function testAssignerShape() public {
    vm.startPrank(deployer);
    uint256 assignerID = world.getUniqueEntityId();
    uint256 actionID = world.getUniqueEntityId();
    _IndexRoomComponent.set(assignerID, 1);
    _IndexRoomComponent.set(alice.id, 2); // wrong room
    vm.stopPrank();

    // uncreated assigner checks
    assertTrue(LibAssigner.isUniversal(_IDToComponent, actionID));
    assertTrue(LibAssigner.check(components, assignerID, actionID, alice.id));

    // create assigner
    uint256 relationID = _createAssigner(assignerID, actionID);

    // shape checks
    assertEq(LibRelation.get(components, assignerID, actionID), relationID);
    assertEq(LibRelation.getViaComp(_IDToComponent, assignerID, actionID), relationID);
    assertEq(LibRelation.getViaComp(_IDFromComponent, assignerID, actionID), relationID);

    // condition checks
    assertTrue(!LibAssigner.isUniversal(_IDToComponent, actionID));
    assertTrue(!LibAssigner.check(components, assignerID, actionID, alice.id));
    _setUint32(_IndexRoomComponent, alice.id, 1); // move to correct room
    assertTrue(LibAssigner.check(components, assignerID, actionID, alice.id));
  }

  function testQuestAssigner() public {
    uint32 room = 111;
    uint256 assignerID = _createNPC(1, room, "testNPC");
    uint256 actionID = _createQuest(1, 0);

    // no assigner yet, accept
    _acceptQuest(alice, 1);
    assertTrue(_hasQuest(alice, 1));

    // create assigner
    vm.prank(deployer);
    __QuestRegistrySystem.addAssigner(1, "NPC", 1);

    // fails
    vm.prank(bob.operator);
    vm.expectRevert("not assigner");
    _QuestAcceptSystem.executeTyped(0, 1); // wrong assignerID
    vm.prank(bob.operator);
    vm.expectRevert("not assigner");
    _QuestAcceptSystem.executeTyped(assignerID, 1); // wrong room

    // accept from correct room
    _setUint32(_IndexRoomComponent, bob.id, room);
    vm.prank(bob.operator);
    _QuestAcceptSystem.executeTyped(assignerID, 1);
    assertTrue(_hasQuest(bob, 1));

    // remove and rebuild quest, without assigner
    vm.prank(deployer);
    __QuestRegistrySystem.remove(1);
    _createQuest(1, 0);

    // try universal again
    _acceptQuest(charlie, 1);
    assertTrue(_hasQuest(charlie, 1));
  }

  /////////////////
  // UTILS

  function _createAssigner(uint256 assignerID, uint256 actionID) internal returns (uint256 id) {
    vm.startPrank(deployer);
    id = LibAssigner.create(components, assignerID, actionID);
    vm.stopPrank();
  }
}
