// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

interface IEmitter {
  event WorldEvent(string indexed identifier, uint8[] schema, bytes value);
  event Message(uint32 indexed roomIndex, uint256 indexed accountID, string message);

  function emitWorldEvent(
    string calldata identifier,
    uint8[] calldata schema,
    bytes calldata value
  ) external;

  function emitMessage(uint32 roomIndex, uint256 accountID, string memory message) external;
}
