// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";

contract RoomTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
  }

  function setUpRooms() public override {
    return;
  }

  function initBasicRooms() public {
    _createRoom("testRoom1", Location(1, 1, 0), 1, 4);
    _createRoom("testRoom2", Location(2, 1, 0), 2, 3);
    _createRoom("testRoom3", Location(1, 2, 0), 3, 2);
    _createRoom("testRoom4", Location(2, 2, 0), 4, 1);
  }

  ///////////////
  // TESTS

  function testAdjacency() public {
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

    _createRoom("1", Location(1, 1, 0), 1);
    _createRoom("2", Location(2, 1, 0), 2);
    _createRoom("3", Location(1, 2, 0), 3);
    _createRoom("4", Location(2, 2, 0), 4);
    _createRoom("5", Location(5, 2, 0), 5);
    _createRoom("6", Location(2, 1, 1), 6);

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

  function testAdjacencyFuzz(int16 x1, int16 y1, int16 z1, int16 x2, int16 y2, int16 z2) public {
    // Large inputs are not expected here, hence int16 instead of int32 is ok
    vm.assume(z1 < 2 && z1 > -2);
    vm.assume(z2 < 2 && z2 > -2);
    vm.assume(!LibRoom.isSameLocation(Location(x1, y1, z1), Location(x2, y2, z2)));

    uint32 accountIndex = 0;
    _createRoom("1", Location(x1, y1, z1), 1);
    _createRoom("2", Location(x2, y2, z2), 2);

    if (_uncheckedAdjacent(Location(x1, y1, z1), Location(x2, y2, z2))) {
      _AssertReachable(1, 2);
      _AssertAccRoom(accountIndex, 1);
      _moveAccount(accountIndex, 2);
      _AssertAccRoom(accountIndex, 2);
      _moveAccount(accountIndex, 1);
    } else {
      // if not adjacent
      _AssertReachable(1, 2, false);
      _AssertAccRoom(accountIndex, 1);
      vm.prank(_operators[_owners[accountIndex]]);
      vm.expectRevert("AccMove: unreachable room");
      _AccountMoveSystem.executeTyped(2);
      _AssertAccRoom(accountIndex, 1);
    }
  }

  function testExitFuzzTrue(
    uint32 exit,
    int16 x1,
    int16 y1,
    int16 z1,
    int16 x2,
    int16 y2,
    int16 z2
  ) public {
    vm.assume(z1 < 2 && z1 > -2);
    vm.assume(z2 < 2 && z2 > -2);
    vm.assume(exit != 1 && exit != 0);
    vm.assume(!LibRoom.isSameLocation(Location(x1, y1, z1), Location(x2, y2, z2)));
    vm.assume(!LibRoom.isAdjacent(Location(x1, y1, z1), Location(x2, y2, z2)));

    uint32 accountIndex = 0;
    _createRoom("1", Location(x1, y1, z1), 1, exit);
    _createRoom("2", Location(x2, y2, z2), exit);

    _AssertReachable(1, exit);

    _AssertAccRoom(accountIndex, 1);
    _moveAccount(accountIndex, exit);
    _AssertAccRoom(accountIndex, exit);
  }

  function testExitFuzzFalse(
    uint32 realExit,
    uint32 fakeExit,
    int16 x1,
    int16 y1,
    int16 z1,
    int16 x2,
    int16 y2,
    int16 z2
  ) public {
    vm.assume(z1 < 2 && z1 > -2);
    vm.assume(z2 < 2 && z2 > -2);
    vm.assume(realExit != fakeExit);
    vm.assume(realExit != 1 && fakeExit != 1);
    vm.assume(!LibRoom.isSameLocation(Location(x1, y1, z1), Location(x2, y2, z2)));
    vm.assume(!LibRoom.isAdjacent(Location(x1, y1, z1), Location(x2, y2, z2)));

    uint32 accountIndex = 0;
    _createRoom("1", Location(x1, y1, z1), 1, realExit);
    _createRoom("2", Location(x2, y2, z2), fakeExit);

    _AssertReachable(1, fakeExit, false);

    _AssertAccRoom(accountIndex, 1);
    vm.prank(_operators[_owners[accountIndex]]);
    vm.expectRevert("AccMove: unreachable room");
    _AccountMoveSystem.executeTyped(fakeExit);
    _AssertAccRoom(accountIndex, 1);
  }

  function testClosedGate() public {
    uint32[] memory exits = new uint32[](2);
    exits[0] = 2;
    exits[1] = 4;
    _createRoom("1", Location(1, 1, 0), 1, exits);
    _createRoom("2", Location(10, 10, 10), 2);
    _createRoom("3", Location(2, 1, 0), 3);
    _createRoom("4", Location(11, 10, 10), 4);
    _createRoom("5", Location(1, 2, 0), 5);
    vm.startPrank(deployer);
    __RoomCreateGateSystem.executeTyped(2, 0, 10, 1, "ITEM", "CURR_MIN");
    __RoomCreateGateSystem.executeTyped(3, 0, 10, 1, "ITEM", "CURR_MIN");
    __RoomCreateGateSystem.executeTyped(4, 1, 10, 1, "ITEM", "CURR_MIN");
    __RoomCreateGateSystem.executeTyped(5, 1, 10, 1, "ITEM", "CURR_MIN");
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

  //////////////
  // UTILS TEST

  function testUintConversion(int32 x, int32 y, int32 z) public {
    Location memory original = Location(x, y, z);
    uint256 converted = LibRoom.locationToUint256(original);
    Location memory postConvert = LibRoom.uint256ToLocation(converted);

    assertEq(original, postConvert);
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
        LibRoom.queryByIndex(components, from),
        LibRoom.queryByIndex(components, to)
      ) == state
    );
  }

  function _locFromIndex(uint32 index) internal view returns (Location memory) {
    return LibRoom.getLocation(components, LibRoom.queryByIndex(components, index));
  }

  function _uncheckedAdjacent(Location memory a, Location memory b) internal view returns (bool) {
    // unchecked to deal with overflows (numbers that big wont happen irl - admin defined)
    return
      ((a.z == b.z && a.x == b.x) && (a.y + 1 == b.y || a.y - 1 == b.y)) ||
      ((a.z == b.z && a.y == b.y) && (a.x + 1 == b.x || a.x - 1 == b.x));
  }
}
