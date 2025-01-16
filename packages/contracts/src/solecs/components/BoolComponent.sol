// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;
import "solecs/Component.sol";
import { TypeLib } from "solecs/components/types/standard.sol";

contract BoolComponent is Component {
  constructor(address world, uint256 id) Component(world, id) {}

  function set(uint256 entity) external virtual onlyWriter {
    _set(entity, TypeLib.encodeBool(true));
  }

  function set(uint256[] memory entities) external virtual onlyWriter {
    _set(entities, TypeLib.encodeBatch(entities.length));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (bool) {
    return TypeLib.decodeBool(_extractRaw(entity));
  }

  function extract(uint256[] memory entities) external virtual onlyWriter returns (bool[] memory) {
    return TypeLib.decodeBatchBool(_extractRaw(entities));
  }

  function get(uint256 entity) external view virtual returns (bool) {
    return _getRaw(entity).length != 0;
  }

  function get(uint256[] memory entities) external view virtual returns (bool[] memory) {
    return TypeLib.decodeBatchBool(_getRaw(entities));
  }

  function safeGet(uint256 entity) external view virtual returns (bool) {
    return TypeLib.safeDecodeBool(_getRaw(entity));
  }

  function safeGet(uint256[] memory entities) external view virtual returns (bool[] memory) {
    return TypeLib.safeDecodeBatchBool(_getRaw(entities));
  }

  function getEntitiesWithValue(bool value) external view virtual returns (uint256[] memory) {
    return _getEntitiesWithValue(TypeLib.encodeBool(value));
  }
}
