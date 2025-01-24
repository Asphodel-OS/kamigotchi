// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

interface IEmitter {
  function emitSystemCalled(
    string calldata identifier,
    uint8[] calldata schema,
    bytes calldata value
  ) external;

  function emitMessage(uint32 nodeIndex, uint256 accountId, string memory message) external;
}
