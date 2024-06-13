// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { IOwnableWritable } from "./IOwnableWritable.sol";
import { LibTypes } from "../LibTypes.sol";

interface IComponent is IOwnableWritable {
  function set(uint256 entity, bytes memory value) external;

  function setBatch(uint256[] memory entities, bytes[] memory values) external;

  function remove(uint256 entity) external;

  function removeBatch(uint256[] memory entities) external;

  function extractRaw(uint256 entity) external returns (bytes memory);

  function extractRawBatch(uint256[] memory entities) external returns (bytes[] memory);

  function has(uint256 entity) external view returns (bool);

  function getRaw(uint256 entity) external view returns (bytes memory);

  function getRawBatch(uint256[] memory entities) external view returns (bytes[] memory);

  function getEntities() external view returns (uint256[] memory);

  function getEntitiesWithValue(bytes memory value) external view returns (uint256[] memory);

  function world() external view returns (address);
}
