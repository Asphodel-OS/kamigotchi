// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IEmitter } from "solecs/interfaces/IEmitter.sol";
import { addressToEntity } from "solecs/utils.sol";

contract Emitter is IEmitter {
  IUintComp public immutable systems;

  /// @dev only allow system to emit events
  modifier onlySystems() {
    require(systems.has(addressToEntity(msg.sender)), "only systems can emit events");
    _;
  }

  constructor(IWorld world) {
    systems = IUintComp(world.systems());
  }

  function emitWorldEvent(
    string memory identifier,
    uint8[] calldata schema,
    bytes calldata value
  ) external onlySystems {
    emit WorldEvent(identifier, schema, value);
  }

  function emitMessage(
    uint32 roomIndex,
    uint256 accountID,
    string memory message
  ) external onlySystems {
    emit Message(roomIndex, accountID, message);
  }
}
