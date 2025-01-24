// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

contract Emitter {
  event SystemCalled(string indexed identifier, uint8[] schema, bytes value);
  event Message(uint32 indexed roomIndex, uint256 indexed accountId, string message);

  function emitSystemCalled(
    string memory identifier,
    uint8[] calldata schema,
    bytes calldata value
  ) external {
    emit SystemCalled(identifier, schema, value);
  }

  function emitMessage(uint32 roomIndex, uint256 accountId, string memory message) external {
    emit Message(roomIndex, accountId, message);
  }
}
