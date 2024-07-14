// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibConfig } from "libraries/LibConfig.sol";

abstract contract PlayerSystem is System {
  modifier notPaused() {
    require(!LibConfig.has(components, "PAUSED"), "Game paused");
    _;
  }

  constructor(IWorld _world, address _components) System(_world, _components) {}
}
