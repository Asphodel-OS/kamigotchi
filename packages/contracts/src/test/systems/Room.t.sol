// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

contract RoomTest is SetupTemplate {
  function setUp() public override {
    super.setUp();

    // [base stamina, base recovery period per point, base movement cost (in stamina), base experience per move]
    _setConfig("ACCOUNT_STAMINA", [uint32(20), 300, 1, 0, 0, 0, 0, 0]);
  }

  function setUpRooms() public override {
    return;
  }

  function initBasicRooms() public {
    _createRoom("testRoom1", Coord(1, 1, 0), 1, 4);
    _createRoom("testRoom2", Coord(2, 1, 0), 2, 3);
    _createRoom("testRoom3", Coord(1, 2, 0), 3, 2);
    _createRoom("testRoom4", Coord(2, 2, 0), 4, 1);
  }

  ///////////////
  // TESTS

  function testRoomShape() public {
    uint256 roomID = _createRoom("1", Coord(1, 1, 0), 1);
    assertTrue(LibEntityType.isShape(components, roomID, "ROOM"));
    assertTrue(_isSameLocation(Coord(1, 1, 0), _locFromIndex(1)));

    _createRoom("2", Coord(2, 1, 0), 2);
    _createRoom("3", Coord(1, 2, 0), 3);

    uint256 gate1 = _createRoomGate(1, 0, 10, 1, "ITEM", "CURR_MIN");
    assertTrue(_IDRoomComponent.has(gate1));
    assertEq(LibRoom.genGateAtPtr(1), _IDRoomComponent.get(gate1));
    assertEq(_IDParentComponent.get(gate1), 0);
    uint256[] memory allGates = LibRoom.queryAllGates(components, 1);
    assertEq(allGates.length, 1);
    assertEq(allGates[0], gate1);
    uint256[] memory spGates = LibRoom.queryGates(components, 2, 1);
    assertEq(spGates.length, 1);
    assertEq(spGates[0], gate1);

    uint256 gate2 = _createRoomGate(1, 2, 10, 1, "ITEM", "CURR_MIN");
    assertEq(LibRoom.genGateAtPtr(1), _IDRoomComponent.get(gate2));
    assertEq(LibRoom.genGateSourcePtr(2), _IDParentComponent.get(gate2));
    allGates = LibRoom.queryAllGates(components, 1);
    assertEq(allGates.length, 2);
    assertEq(allGates[0], gate1);
    assertEq(allGates[1], gate2);
    spGates = LibRoom.queryGates(components, 2, 1);
    assertEq(spGates.length, 2);
    assertEq(spGates[0], gate1);
    assertEq(spGates[1], gate2);
    spGates = LibRoom.queryGates(components, 3, 1);
    assertEq(spGates.length, 1);
    assertEq(spGates[0], gate1);

    vm.prank(deployer);
    __RoomRegistrySystem.addFlag(1, "TEST_FLAG");
    assertTrue(LibFlag.has(components, roomID, "TEST_FLAG"));

    vm.prank(deployer);
    __RoomRegistrySystem.remove(1);
    assertEq(LibRoom.getByIndex(components, 1), 0);
    allGates = LibRoom.queryAllGates(components, 1);
    assertEq(allGates.length, 0);
    spGates = LibRoom.queryGates(components, 2, 1);
    assertEq(spGates.length, 0);
    assertTrue(!_IDRoomComponent.has(gate1));
    assertTrue(!_IDRoomComponent.has(gate2));
  }

  function testMoveStamina(uint8 rawNumMove) public {
    initBasicRooms();

    vm.startPrank(deployer);
    uint256 baseStamina = 55;
    uint256 numMove = uint256(rawNumMove) % ((baseStamina * 2) / 5); // limit fuzz
    LibStat.setStamina(
      components,
      alice.id,
      Stat(int32(int(baseStamina)), 0, 0, int32(int(baseStamina)))
    );
    vm.stopPrank();

    // move
    vm.startPrank(alice.operator);
    for (uint i = 0; i < numMove; i += 5) {
      uint32 nextRoom = LibRoom.get(components, alice.id) == 1 ? 2 : 1;
      if (i > baseStamina) vm.expectRevert("Account: insufficient stamina");
      _AccountMoveSystem.executeTyped(nextRoom);
    }
  }

  function testRoomAdjacency() public {
    /*
    z0:
    | 1 | 2 |
    –––––––––
    | 3 | 4 |   | 5 |
    (no crossing)

    z1:
    | - | 6 |
    –––––––––
    | - | - |  
     */

    address operator = _operators[_owners[0]];

    _createRoom("1", Coord(1, 1, 0), 1);
    _createRoom("2", Coord(2, 1, 0), 2);
    _createRoom("3", Coord(1, 2, 0), 3);
    _createRoom("4", Coord(2, 2, 0), 4);
    _createRoom("5", Coord(5, 2, 0), 5);
    _createRoom("6", Coord(2, 1, 1), 6);

    // assert from room 1 perspective
    assertTrue(LibRoom.isAdjacent(_locFromIndex(1), _locFromIndex(2)));
    assertTrue(LibRoom.isAdjacent(_locFromIndex(1), _locFromIndex(3)));
    assertTrue(!LibRoom.isAdjacent(_locFromIndex(1), _locFromIndex(4)));
    assertTrue(!LibRoom.isAdjacent(_locFromIndex(1), _locFromIndex(5)));
    assertTrue(!LibRoom.isAdjacent(_locFromIndex(1), _locFromIndex(6)));
    assertTrue(!LibRoom.isAdjacent(_locFromIndex(1), _locFromIndex(1)));

    _moveAccount(0, 2);
    _AssertAccRoom(0, 2);
    _moveAccount(0, 1);
    _AssertAccRoom(0, 1);

    _moveAccount(0, 3);
    _AssertAccRoom(0, 3);
    _moveAccount(0, 1);
    _AssertAccRoom(0, 1);

    vm.prank(operator);
    vm.expectRevert("AccMove: unreachable room");
    _AccountMoveSystem.executeTyped(4);
    _AssertAccRoom(0, 1);

    vm.prank(operator);
    vm.expectRevert("AccMove: unreachable room");
    _AccountMoveSystem.executeTyped(5);
    _AssertAccRoom(0, 1);

    vm.prank(operator);
    vm.expectRevert("AccMove: unreachable room");
    _AccountMoveSystem.executeTyped(6);
    _AssertAccRoom(0, 1);

    vm.prank(operator);
    vm.expectRevert("AccMove: unreachable room");
    _AccountMoveSystem.executeTyped(1);
    _AssertAccRoom(0, 1);
  }

  function testOpenedGate() public {
    uint32 accountIndex = 0;
    _createRoom("1", Coord(1, 1, 0), 1);
    _createRoom("2", Coord(0, 1, 0), 2);

    vm.startPrank(deployer);
    __RoomRegistrySystem.addGate(abi.encode(2, 0, 0, 0, "ITEM", "CURR_MIN", ""));
    vm.stopPrank();

    _AssertAccRoom(accountIndex, 1);
    _moveAccount(accountIndex, 2);
    _AssertAccRoom(accountIndex, 2);
  }

  function testClosedGate() public {
    uint32[] memory exits = new uint32[](2);
    exits[0] = 2;
    exits[1] = 4;
    _createRoom("1", Coord(1, 1, 0), 1, exits);
    _createRoom("2", Coord(10, 10, 10), 2);
    _createRoom("3", Coord(2, 1, 0), 3);
    _createRoom("4", Coord(11, 10, 10), 4);
    _createRoom("5", Coord(1, 2, 0), 5);
    vm.startPrank(deployer);
    __RoomRegistrySystem.addGate(abi.encode(2, 0, 10, 1, "ITEM", "CURR_MIN", ""));
    __RoomRegistrySystem.addGate(abi.encode(3, 0, 10, 1, "ITEM", "CURR_MIN", ""));
    __RoomRegistrySystem.addGate(abi.encode(4, 1, 10, 1, "ITEM", "CURR_MIN", ""));
    __RoomRegistrySystem.addGate(abi.encode(5, 1, 10, 1, "ITEM", "CURR_MIN", ""));
    vm.stopPrank();

    uint32 accountIndex = 0;

    _AssertReachable(1, 2);
    _AssertReachable(1, 3);
    _AssertReachable(1, 4);
    _AssertReachable(1, 5);
    _AssertReachable(2, 4);

    _AssertAccessible(1, 2, accountIndex, false);
    _AssertAccessible(1, 3, accountIndex, false);
    _AssertAccessible(1, 4, accountIndex, false);
    _AssertAccessible(1, 5, accountIndex, false);
    _AssertAccessible(4, 2, accountIndex, false);
    _AssertAccessible(2, 4, accountIndex);

    // actually trying to move
    for (uint32 i = 2; i < 6; i++) {
      _AssertAccRoom(accountIndex, 1);
      vm.prank(_getOperator(accountIndex));
      vm.expectRevert("AccMove: inaccessible room");
      _AccountMoveSystem.executeTyped(i);
      _AssertAccRoom(accountIndex, 1);
    }

    // force account to room 4, check if gate at room 2 blocks from all sources
    vm.startPrank(deployer);
    _IndexRoomComponent.set(_getAccount(accountIndex), 4);
    vm.stopPrank();
    vm.prank(_getOperator(accountIndex));
    vm.expectRevert("AccMove: inaccessible room");
    _AccountMoveSystem.executeTyped(2);
    _AssertAccRoom(accountIndex, 4);

    // force account to room 2, check if can move to room 4 (gate only blocks from room 1)
    vm.startPrank(deployer);
    _IndexRoomComponent.set(_getAccount(accountIndex), 2);
    vm.stopPrank();
    vm.prank(_getOperator(accountIndex));
    _AccountMoveSystem.executeTyped(4);
    _AssertAccRoom(accountIndex, 4);
  }

  function testGoalGate() public {
    uint32 goalIndex = 1;
    uint256 goalAmt = 1111;
    uint256 goalID = _createGoal(
      goalIndex,
      1,
      Condition("ITEM", "CURR_MIN", MUSU_INDEX, goalAmt, "")
    );
    _createRoom("1", Coord(1, 1, 0), 1); // original room, goal located here
    _createRoom("2", Coord(0, 1, 0), 2); // room to be gated
    _createRoomGate(2, 0, 0, LibGoals.genGoalID(goalIndex), "COMPLETE_COMP", "BOOL_IS");

    // alice tries to move to room 2, but its closed
    vm.prank(alice.operator);
    vm.expectRevert("AccMove: inaccessible room");
    _AccountMoveSystem.executeTyped(2);

    // partial goal contribution
    _fundAccount(alice.index, 1);
    vm.prank(alice.operator);
    _GoalContributeSystem.executeTyped(goalIndex, 1);
    // try move
    vm.prank(alice.operator);
    vm.expectRevert("AccMove: inaccessible room");
    _AccountMoveSystem.executeTyped(2);

    // full goal contribution
    _fundAccount(alice.index, goalAmt);
    vm.prank(alice.operator);
    _GoalContributeSystem.executeTyped(goalIndex, goalAmt);
    _moveAccount(alice.index, 2);
    _AssertAccRoom(uint32(alice.index), 2);
  }

  //////////////
  // UTILS

  function _AssertAccRoom(uint32 playerIndex, uint32 roomIndex) internal {
    assertEq(LibAccount.getRoom(components, _getAccount(playerIndex)), roomIndex);
  }

  function _AssertAccessible(uint32 from, uint32 to, uint32 accIndex) internal {
    _AssertAccessible(from, to, accIndex, true);
  }

  function _AssertAccessible(uint32 from, uint32 to, uint32 accIndex, bool state) internal {
    assertTrue(LibRoom.isAccessible(components, from, to, _getAccount(accIndex)) == state);
  }

  function _AssertReachable(uint32 from, uint32 to) internal {
    _AssertReachable(from, to, true);
  }

  function _AssertReachable(uint32 from, uint32 to, bool state) internal {
    assertTrue(
      LibRoom.isReachable(
        components,
        to,
        LibRoom.getByIndex(components, from),
        LibRoom.getByIndex(components, to)
      ) == state
    );
  }

  function _isSameLocation(Coord memory a, Coord memory b) internal pure returns (bool) {
    return keccak256(abi.encode(a)) == keccak256(abi.encode(b));
  }

  function _locFromIndex(uint32 index) internal view returns (Coord memory) {
    return LibRoom.getLocation(components, LibRoom.getByIndex(components, index));
  }

  function _uncheckedAdjacent(Coord memory a, Coord memory b) internal view returns (bool) {
    // unchecked to deal with overflows (numbers that big wont happen irl - admin defined)
    return
      ((a.z == b.z && a.x == b.x) && (a.y + 1 == b.y || a.y - 1 == b.y)) ||
      ((a.z == b.z && a.y == b.y) && (a.x + 1 == b.x || a.x - 1 == b.x));
  }
}
