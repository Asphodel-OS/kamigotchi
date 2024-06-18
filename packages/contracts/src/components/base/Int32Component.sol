// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "solecs/Component.sol";
import { TypeLib } from "components/types/standard.sol";

contract Int32Component is Component {
  constructor(address world, uint256 id) Component(world, id) {}

  function set(uint256 entity, int32 value) external virtual onlyWriter {
    _set(entity, TypeLib.encodeInt32(value));
  }

  function setBatch(uint256[] memory entities, int32[] memory values) external virtual onlyWriter {
    _setBatch(entities, TypeLib.encodeBatch(values));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (int32) {
    return TypeLib.decodeInt32(_extractRaw(entity));
  }

  function extractBatch(
    uint256[] memory entities
  ) external virtual onlyWriter returns (int32[] memory) {
    return TypeLib.decodeBatchInt32(_extractRawBatch(entities));
  }

  function get(uint256 entity) external view virtual returns (int32) {
    return TypeLib.decodeInt32(_getRaw(entity));
  }

  function getBatch(uint256[] memory entities) external view virtual returns (int32[] memory) {
    return TypeLib.decodeBatchInt32(_getRawBatch(entities));
  }

  function getEntitiesWithValue(int32 value) external view virtual returns (uint256[] memory) {
    return _getEntitiesWithValue(TypeLib.encodeInt32(value));
  }
}
