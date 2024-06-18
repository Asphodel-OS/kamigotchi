// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "solecs/Component.sol";
import { TypeLib } from "components/types/standard.sol";

contract Uint256Component is Component {
  constructor(address world, uint256 id) Component(world, id) {}

  function set(uint256 entity, uint256 value) external virtual onlyWriter {
    _set(entity, TypeLib.encodeUint256(value));
  }

  function setBatch(
    uint256[] memory entities,
    uint256[] memory values
  ) external virtual onlyWriter {
    _setBatch(entities, TypeLib.encodeBatch(values));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (uint256) {
    return TypeLib.decodeUint256(_extractRaw(entity));
  }

  function extractBatch(
    uint256[] memory entities
  ) external virtual onlyWriter returns (uint256[] memory) {
    return TypeLib.decodeBatchUint256(_extractRawBatch(entities));
  }

  function get(uint256 entity) external view virtual returns (uint256) {
    return TypeLib.decodeUint256(_getRaw(entity));
  }

  function getBatch(uint256[] memory entities) external view virtual returns (uint256[] memory) {
    return TypeLib.decodeBatchUint256(_getRawBatch(entities));
  }

  function getEntitiesWithValue(uint256 value) external view virtual returns (uint256[] memory) {
    return _getEntitiesWithValue(TypeLib.encodeUint256(value));
  }
}
