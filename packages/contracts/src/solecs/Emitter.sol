// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { addressToEntity } from "solecs/utils.sol";

contract Emitter {
  IUintComp public systems;

  event SystemCalled(string indexed identifier, uint8[] schema, bytes value);
  event Message(uint32 indexed roomIndex, uint256 indexed accountId, string message);

  /// @dev only allow system to emit events
  modifier onlySystems() {
    require(systems.has(addressToEntity(msg.sender)), "only systems can emit events");
    _;
  }

  constructor(IWorld world) {
    systems = IUintComp(world.systems());
  }

  function emitSystemCalled(
    string memory identifier,
    uint8[] calldata schema,
    bytes calldata value
  ) external onlySystems {
    emit SystemCalled(identifier, schema, value);
  }

  function emitMessage(
    uint32 roomIndex,
    uint256 accountId,
    string memory message
  ) external onlySystems {
    emit Message(roomIndex, accountId, message);
  }
}
