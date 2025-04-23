// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

contract FriendTest is SetupTemplate {
  function setUp() public override {
    super.setUp();

    vm.roll(_currBlock++);

    _setConfig("FRIENDS_BASE_LIMIT", 5);
    _setConfig("FRIENDS_REQUEST_LIMIT", 5);
  }

  function _request(uint256 senderIndex, uint256 reciverIndex) internal returns (uint256) {
    address senderAddr = _getOperator(senderIndex);
    address recieverAddr = _getOwner(reciverIndex);

    vm.prank(senderAddr);
    uint256 requestID = abi.decode(_FriendRequestSystem.executeTyped(recieverAddr), (uint256));

    return requestID;
  }

  function _accept(uint256 reciverIndex, uint256 requestID) internal returns (uint256) {
    address recieverAddr = _getOperator(reciverIndex);

    vm.prank(recieverAddr);
    uint256 id = abi.decode(_FriendAcceptSystem.executeTyped(requestID), (uint256));

    return id;
  }

  function _cancel(uint256 accIndex, uint256 cancelID) internal {
    address accAddr = _getOperator(accIndex);

    vm.prank(accAddr);
    _FriendCancelSystem.executeTyped(cancelID);
  }

  function _block(uint256 senderIndex, uint256 reciverIndex) internal returns (uint256) {
    address senderAddr = _getOperator(senderIndex);
    address recieverAddr = _getOwner(reciverIndex);

    vm.prank(senderAddr);
    uint256 blockID = abi.decode(_FriendBlockSystem.executeTyped(recieverAddr), (uint256));

    return blockID;
  }

  function testRequestBasic() public {
    uint256 requestID = _request(0, 1);

    _assertFSEntity(requestID, 0, 1, "REQUEST");
  }

  function testRequestBlocked() public {
    _block(0, 1);

    address senderAddr = _getOperator(1);
    address recieverAddr = _getOwner(0);

    vm.prank(senderAddr);
    vm.expectRevert("FriendRequest: blocked");
    _FriendRequestSystem.executeTyped(recieverAddr);
  }

  function testRequestBlocked2() public {
    _block(1, 0);

    address senderAddr = _getOperator(0);
    address recieverAddr = _getOwner(1);

    vm.prank(senderAddr);
    vm.expectRevert("FriendRequest: blocked");
    _FriendRequestSystem.executeTyped(recieverAddr);
  }

  function testRequestLimit() public {
    uint256 baseLimit = LibConfig.get(components, "FRIENDS_REQUEST_LIMIT");
    for (uint256 i = 1; i < baseLimit + 1; i++) {
      _request(i, 0);
    }

    vm.prank(_getOperator(baseLimit + 2));
    vm.expectRevert("Max friend requests reached");
    _FriendRequestSystem.executeTyped(_getOwner(0));
  }

  function testRequestCancel() public {
    uint256 requestID = _request(0, 1);
    _assertFSEntity(requestID, 0, 1, "REQUEST");

    _cancel(0, requestID);
    _assertFSDeletion(requestID);
  }

  function testAcceptBasic() public {
    uint256 requestID = _request(0, 1);
    uint256 id = _accept(1, requestID);

    _assertFSEntity(id, 1, 0, "FRIEND");
    _assertFSEntity(requestID, 0, 1, "FRIEND");
    _assertFriends(0, 1);
  }

  function testAcceptLimit() public {
    uint256 baseLimit = LibConfig.get(components, "FRIENDS_BASE_LIMIT");
    for (uint256 i = 1; i < baseLimit + 1; i++) {
      _accept(0, _request(i, 0));
    }

    uint256 requestID = _request(baseLimit + 2, 0);
    vm.prank(_getOperator(0));
    vm.expectRevert("Friend limit reached");
    _FriendAcceptSystem.executeTyped(requestID);
  }

  function testFriendCancel() public {
    uint256 requestID = _request(0, 1);
    uint256 id = _accept(1, requestID);
    _assertFriends(0, 1);

    _cancel(1, id);

    _assertFSDeletion(id);
    _assertFSDeletion(requestID);
  }

  function testBlockBasic() public {
    uint256 blockID = _block(0, 1);

    _assertFSEntity(blockID, 0, 1, "BLOCKED");
  }

  function testBlockReq() public {
    uint256 requestID = _request(0, 1);
    _assertFSEntity(requestID, 0, 1, "REQUEST");

    uint256 blockID = _block(0, 1);
    _assertFSEntity(blockID, 0, 1, "BLOCKED");
  }

  function testBlockReq2() public {
    uint256 requestID = _request(0, 1);
    _assertFSEntity(requestID, 0, 1, "REQUEST");

    uint256 blockID = _block(1, 0);
    _assertFSEntity(blockID, 1, 0, "BLOCKED");
    _assertFSDeletion(requestID);
  }

  function testBlockFriend() public {
    uint256 requestID = _request(0, 1);
    uint256 fsID = _accept(1, requestID);
    _assertFriends(0, 1);

    uint256 blockID = _block(0, 1);

    _assertFSEntity(blockID, 0, 1, "BLOCKED");
    _assertFSDeletion(fsID);
    assertTrue(!_areFriends(0, 1));
  }

  function testBlockCancel() public {
    uint256 blockID = _block(0, 1);
    _assertFSEntity(blockID, 0, 1, "BLOCKED");

    _cancel(0, blockID);
    _assertFSDeletion(blockID);
  }

  function testCounters() public {
    uint256 aliceIndex = 0;
    uint256 bobIndex = 1;

    // requests
    uint256 requestAB = _request(aliceIndex, bobIndex);
    assertEq(LibFriend.getRequestCount(components, _getAccount(bobIndex)), 1); // incoming
    assertEq(LibFriend.getFriendCount(components, _getAccount(aliceIndex)), 0);

    // friends after accepting
    uint256 friendshipBA = _accept(bobIndex, requestAB);
    assertEq(LibFriend.getRequestCount(components, _getAccount(bobIndex)), 0); // incoming
    assertEq(LibFriend.getFriendCount(components, _getAccount(aliceIndex)), 1);
    assertEq(LibFriend.getFriendCount(components, _getAccount(bobIndex)), 1);

    // cancel friendship
    _cancel(bobIndex, friendshipBA);
    assertEq(LibFriend.getFriendCount(components, _getAccount(aliceIndex)), 0);
    assertEq(LibFriend.getFriendCount(components, _getAccount(bobIndex)), 0);

    // request and cancel request
    requestAB = _request(aliceIndex, bobIndex);
    assertEq(LibFriend.getRequestCount(components, _getAccount(bobIndex)), 1);
    _cancel(bobIndex, requestAB);
    assertEq(LibFriend.getRequestCount(components, _getAccount(bobIndex)), 0);

    // request and block
    requestAB = _request(aliceIndex, bobIndex);
    uint256 blockAB = _block(aliceIndex, bobIndex);
    assertEq(LibFriend.getRequestCount(components, _getAccount(bobIndex)), 0);
    _cancel(aliceIndex, blockAB);
    assertEq(LibFriend.getRequestCount(components, _getAccount(bobIndex)), 0);
    requestAB = _request(aliceIndex, bobIndex);
    uint256 blockBA = _block(bobIndex, aliceIndex);
    assertEq(LibFriend.getRequestCount(components, _getAccount(bobIndex)), 0);
    _cancel(bobIndex, blockBA);
    assertEq(LibFriend.getRequestCount(components, _getAccount(bobIndex)), 0);

    // friends and block
    requestAB = _request(aliceIndex, bobIndex);
    friendshipBA = _accept(bobIndex, requestAB);
    _block(aliceIndex, bobIndex);
    assertEq(LibFriend.getFriendCount(components, _getAccount(aliceIndex)), 0);
    assertEq(LibFriend.getFriendCount(components, _getAccount(bobIndex)), 0);
  }

  ////////////////////
  // UTILS

  function _assertFSEntity(
    uint256 id,
    uint256 accIndex,
    uint256 targetIndex,
    string memory state
  ) internal {
    assertTrue(LibEntityType.isShape(components, id, "FRIENDSHIP"));
    assertEq(_IdSourceComponent.get(id), _getAccount(accIndex));
    assertEq(_IdTargetComponent.get(id), _getAccount(targetIndex));
    assertEq(_StateComponent.get(id), state);
  }

  function _assertFSDeletion(uint256 id) internal {
    assertTrue(!LibEntityType.has(components, id));
    assertTrue(!_IdSourceComponent.has(id));
    assertTrue(!_IdTargetComponent.has(id));
    assertTrue(!_StateComponent.has(id));
  }

  function _assertFriends(uint256 accIndex, uint256 targetIndex) internal {
    assertTrue(_areFriends(accIndex, targetIndex));
    assertTrue(_areFriends(targetIndex, accIndex));
  }

  function _areFriends(uint256 accIndex, uint256 targetIndex) internal view returns (bool) {
    uint256 accID = _getAccount(accIndex);
    uint256 targetID = _getAccount(targetIndex);

    return LibFriend.areFriends(components, accID, targetID);
  }

  function _getFriendship(uint256 accIndex, uint256 targetIndex) internal view returns (uint256) {
    uint256 accID = _getAccount(accIndex);
    uint256 targetID = _getAccount(targetIndex);

    return LibFriend.getFriendship(components, accID, targetID);
  }
}
