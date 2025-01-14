// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IEmitter {
  function emitSystemCalled(
    uint256 systemId,
    uint8[] calldata schema,
    bytes calldata value
  ) external;

  function emitMessage(uint32 nodeIndex, uint256 accountId, string memory message) external;
}
