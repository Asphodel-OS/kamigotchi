// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "tests/utils/SetupTemplate.t.sol";

contract ChatTest is SetupTemplate {
  function setUp() public override {
    super.setUp();

    vm.roll(_currBlock++);
  }

  function _sendMessage(string memory message, uint256 index) internal {
    address senderAddr = _getOperator(index);

    vm.prank(senderAddr);
    _ChatSystem.executeTyped(message);
  }

  function _getNumberOfMessages(uint256 index) internal view returns (uint256) {
    uint256 accID = _getAccount(index);

    uint256 messages = LibData.get(components, accID, 0, "MESSAGES");
    return messages;
  }

  function testCounter() public {
    _sendMessage("hello2", alice.index);
    uint256 messages = _getNumberOfMessages(alice.index);
    assertEq(messages, 1);
    _sendMessage("hello2", alice.index);
    _sendMessage("hello3", alice.index);
    messages = _getNumberOfMessages(alice.index);
    assertEq(messages, 3);
    _sendMessage("hello1", bob.index);
    messages = _getNumberOfMessages(alice.index);
    assertEq(messages, 3);
  }
}
