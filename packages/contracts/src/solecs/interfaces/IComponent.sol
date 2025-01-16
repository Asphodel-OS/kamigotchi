// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IOwnableWritable } from "./IOwnableWritable.sol";
import { LibTypes } from "../LibTypes.sol";

interface IComponent is IOwnableWritable {
  function set(uint256 entity, bytes memory value) external;

  function set(uint256[] memory entities, bytes[] memory values) external;

  function remove(uint256 entity) external;

  function remove(uint256[] memory entities) external;

  function extractRaw(uint256 entity) external returns (bytes memory);

  function extractRaw(uint256[] memory entities) external returns (bytes[] memory);

  function equal(uint256 entity, bytes memory value) external view returns (bool);

  function equal(uint256[] memory entities, bytes memory value) external view returns (bool);

  function has(uint256 entity) external view returns (bool);

  function getRaw(uint256 entity) external view returns (bytes memory);

  function getRaw(uint256[] memory entities) external view returns (bytes[] memory);

  function getEntitiesWithValue(bytes memory value) external view returns (uint256[] memory);
}
