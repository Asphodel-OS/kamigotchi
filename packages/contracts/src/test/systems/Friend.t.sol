// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

contract FriendTest is SetupTemplate {
  function setUp() public override {
    super.setUp();

    _registerAccount(0);
    _registerAccount(1);

    vm.roll(_currBlock++);
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

  function testReqBasic() public {
    uint256 requestID = _request(0, 1);

    _assertFSEntity(requestID, 0, 1, "REQUEST");
  }

  function testReqBlocked() public {
    _block(0, 1);

    address senderAddr = _getOperator(1);
    address recieverAddr = _getOwner(0);

    vm.prank(senderAddr);
    vm.expectRevert("FriendRequest: not request");
    _FriendRequestSystem.executeTyped(recieverAddr);
  }

  function testReqBlocked2() public {
    _block(1, 0);

    address senderAddr = _getOperator(0);
    address recieverAddr = _getOwner(1);

    vm.prank(senderAddr);
    vm.expectRevert("FriendRequest: not request");
    _FriendRequestSystem.executeTyped(recieverAddr);
  }

  function testReqCancel() public {
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

  function testAcceptByRequest() public {
    uint256 requestID = _request(0, 1);
    uint256 id = _request(1, 0);

    _assertFSEntity(id, 1, 0, "FRIEND");
    _assertFSEntity(requestID, 0, 1, "FRIEND");
    _assertFriends(0, 1);
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
    _assertFSDeletion(requestID);
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

  ////////////////////
  // UTILS

  function _assertFSEntity(
    uint256 id,
    uint256 accIndex,
    uint256 targetIndex,
    string memory state
  ) internal {
    assertTrue(_IsFriendshipComponent.getValue(id));
    assertEq(_IdAccountComponent.getValue(id), _getAccount(accIndex));
    assertEq(_IdTargetComponent.getValue(id), _getAccount(targetIndex));
    assertEq(_StateComponent.getValue(id), state);
  }

  function _assertFSDeletion(uint256 id) internal {
    assertTrue(!_IsFriendshipComponent.has(id));
    assertTrue(!_IdAccountComponent.has(id));
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
