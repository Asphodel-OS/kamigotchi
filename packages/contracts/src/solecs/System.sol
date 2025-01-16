// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { ISystem } from "./interfaces/ISystem.sol";
import { IUint256Component } from "./interfaces/IUint256Component.sol";
import { IWorld } from "./interfaces/IWorld.sol";
import { IEmitter } from "./interfaces/IEmitter.sol";
import { Ownable } from "solady/auth/Ownable.sol";

/**
 * System base contract
 */
abstract contract System is ISystem, Ownable {
  IUint256Component internal immutable components;
  IWorld internal immutable world;

  constructor(IWorld _world, address _components) {
    _initializeOwner(msg.sender);
    components = _components == address(0) ? _world.components() : IUint256Component(_components);
    world = _world;
  }

  /// @notice deprecates the system
  /// @dev emits event for external devs to listen for; does not remove component permissions
  function deprecate() external override onlyOwner {
    emit SystemDeprecated();
  }
}
