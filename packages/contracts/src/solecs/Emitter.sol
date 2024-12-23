// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

contract Emitter {
  event SystemCalled(uint256 indexed systemId, uint256[] schema, bytes value);

  function emitSystemCalled(
    uint256 systemId,
    uint256[] calldata schema,
    bytes calldata value
  ) external {
    emit SystemCalled(systemId, schema, value);
  }
}
