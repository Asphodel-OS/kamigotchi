// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IEmitter } from "solecs/interfaces/IEmitter.sol";

///@notice library for centralized event emission calls to Emitter.sol
library LibEmitter {
  function emitEvent(
    IWorld world,
    string memory identifier,
    uint8[] memory schema,
    bytes memory values
  ) internal {
    address emitter = world._emitter();
    if (emitter != address(0)) IEmitter(emitter).emitWorldEvent(identifier, schema, values);
  }

  function emitMessage(
    IWorld world,
    uint32 roomIndex,
    uint256 accountId,
    string memory message
  ) internal {
    address emitter = world._emitter();
    if (emitter != address(0)) IEmitter(emitter).emitMessage(roomIndex, accountId, message);
  }
}
