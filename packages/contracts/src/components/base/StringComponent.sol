// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "solecs/Component.sol";
import { TypeLib } from "components/types/standard.sol";

contract StringComponent is Component {
  constructor(address world, uint256 id) Component(world, id) {}

  function set(uint256 entity, string memory value) external virtual onlyWriter {
    _set(entity, TypeLib.encodeString(value));
  }

  function setBatch(uint256[] memory entities, string[] memory values) external virtual onlyWriter {
    _setBatch(entities, TypeLib.encodeBatch(values));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (string memory) {
    return TypeLib.decodeString(_extractRaw(entity));
  }

  function extractBatch(
    uint256[] memory entities
  ) external virtual onlyWriter returns (string[] memory) {
    return TypeLib.decodeBatchString(_extractRawBatch(entities));
  }

  function get(uint256 entity) external view virtual returns (string memory) {
    return TypeLib.decodeString(_getRaw(entity));
  }

  function getBatch(uint256[] memory entities) external view virtual returns (string[] memory) {
    return TypeLib.decodeBatchString(_getRawBatch(entities));
  }

  function getEntitiesWithValue(
    string memory value
  ) external view virtual returns (uint256[] memory) {
    return _getEntitiesWithValue(TypeLib.encodeString(value));
  }
}
