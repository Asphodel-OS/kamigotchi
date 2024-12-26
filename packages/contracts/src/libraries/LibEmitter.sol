// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { IWorld } from "../solecs/interfaces/IWorld.sol";
import { IEmitter } from "../solecs/interfaces/IEmitter.sol";

library LibEmitter {
  function emitSystemCall(
    IWorld world,
    uint256 systemId,
    uint8[] memory schema,
    bytes memory values
  ) internal {
    IEmitter(world._emitter()).emitSystemCalled(systemId, schema, values);
  }
}
