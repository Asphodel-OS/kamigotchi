// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;
import "solecs/Component.sol";
import { TypeLib } from "solecs/components/types/standard.sol";

contract Int32Component is Component {
  constructor(address world, uint256 id) Component(world, id) {}

  function set(uint256 entity, int32 value) external virtual onlyWriter {
    _set(entity, TypeLib.encodeInt32(value));
  }

  function set(uint256[] memory entities, int32[] memory values) external virtual onlyWriter {
    _set(entities, TypeLib.encodeBatch(values));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (int32) {
    return TypeLib.decodeInt32(_extractRaw(entity));
  }

  function extract(uint256[] memory entities) external virtual onlyWriter returns (int32[] memory) {
    return TypeLib.decodeBatchInt32(_extractRaw(entities));
  }

  function get(uint256 entity) external view virtual returns (int32) {
    return TypeLib.decodeInt32(_getRaw(entity));
  }

  function get(uint256[] memory entities) external view virtual returns (int32[] memory) {
    return TypeLib.decodeBatchInt32(_getRaw(entities));
  }

  function safeGet(uint256 entity) external view virtual returns (int32) {
    return TypeLib.safeDecodeInt32(_getRaw(entity));
  }

  function safeGet(uint256[] memory entities) external view virtual returns (int32[] memory) {
    return TypeLib.safeDecodeBatchInt32(_getRaw(entities));
  }

  function getEntitiesWithValue(int32 value) external view virtual returns (uint256[] memory) {
    return _getEntitiesWithValue(TypeLib.encodeInt32(value));
  }
}
