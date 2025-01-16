// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IComponent } from "./IComponent.sol";

interface IUint256Component is IComponent {
  function set(uint256 entity, uint256 value) external;

  function get(uint256 entity) external view returns (uint256);

  function getEntitiesWithValue(uint256 value) external view returns (uint256[] memory);

  function safeGet(uint256 entity) external view returns (uint256);
}
