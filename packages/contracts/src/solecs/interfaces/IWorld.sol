// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { IUint256Component } from "./IUint256Component.sol";

interface IWorld {
  function components() external view returns (IUint256Component);

  function systems() external view returns (IUint256Component);

  function registerComponent(address componentAddr, uint256 id) external;

  function registerSystem(address systemAddr, uint256 id) external;

  function registerComponentValueSet(uint256 entity, bytes calldata data) external;

  function registerComponentValueRemoved(uint256 entity) external;

  function getUniqueEntityId() external returns (uint256);

  function init() external;

  function _emitter() external view returns (address);

  function updateEmitter(address emitter) external;
}
