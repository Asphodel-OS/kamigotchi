// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

contract Emitter {
  event SystemCalled(uint256 indexed systemId, uint8[] schema, bytes value);
  event Message(uint32 indexed nodeIndex, uint256 indexed acoountIndex, bytes message, bool global);

  function emitSystemCalled(
    uint256 systemId,
    uint8[] calldata schema,
    bytes calldata value
  ) external {
    emit SystemCalled(systemId, schema, value);
  }

  function emitMessage(
    uint32 nodeIndex,
    uint256 accountIndex,
    bytes memory message,
    bool global
  ) external {
    emit Message(nodeIndex, accountIndex, message, global);
  }
}
