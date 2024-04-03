// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { QueryType } from "./Query.sol";
import { IUint256Component } from "./IUint256Component.sol";

interface IWorld {
  function components() external view returns (IUint256Component);

  function systems() external view returns (IUint256Component);

  function registerComponent(address componentAddr, uint256 id) external;

  function getComponent(uint256 id) external view returns (address);

  function getComponentIdFromAddress(address componentAddr) external view returns (uint256);

  function registerSystem(address systemAddr, uint256 id) external;

  function registerComponentValueSet(
    address component,
    uint256 entity,
    bytes calldata data
  ) external;

  function registerComponentValueSet(uint256 entity, bytes calldata data) external;

  function registerComponentValueRemoved(address component, uint256 entity) external;

  function registerComponentValueRemoved(uint256 entity) external;

  function getNumEntities() external view returns (uint256);

  function hasEntity(uint256 entity) external view returns (bool);

  function getUniqueEntityId() external view returns (uint256);

  function init() external;
}
