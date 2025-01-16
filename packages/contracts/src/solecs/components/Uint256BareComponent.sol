// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;
import "solecs/BareComponent.sol";
import "solecs/interfaces/IUint256Component.sol";
import { TypeLib } from "solecs/components/types/standard.sol";

/**
 * Reference implementation of a component storing a uint256 value for each entity.
 */
contract Uint256BareComponent is BareComponent, IUint256Component {
  constructor(address world, uint256 id) BareComponent(world, id) {}

  function set(uint256 entity, uint256 value) external virtual onlyWriter {
    _set(entity, TypeLib.encodeUint256(value));
  }

  function set(uint256[] memory entities, uint256[] memory values) external virtual onlyWriter {
    _set(entities, TypeLib.encodeBatch(values));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (uint256) {
    return TypeLib.decodeUint256(_extractRaw(entity));
  }

  function extract(
    uint256[] memory entities
  ) external virtual onlyWriter returns (uint256[] memory) {
    return TypeLib.decodeBatchUint256(_extractRaw(entities));
  }

  function inc(uint256 entity, uint256 value) external virtual onlyWriter {
    _inc(entity, value);
  }

  function inc(uint256[] memory entities, uint256 value) external virtual onlyWriter {
    for (uint256 i; i < entities.length; i++) _inc(entities[i], value);
  }

  function inc(uint256[] memory entities, uint256[] memory values) external virtual onlyWriter {
    require(entities.length == values.length, "arr length mismatch");
    for (uint256 i; i < entities.length; i++) _inc(entities[i], values[i]);
  }

  function dec(uint256 entity, uint256 value) external virtual onlyWriter {
    _dec(entity, value);
  }

  function dec(uint256[] memory entities, uint256 value) external virtual onlyWriter {
    for (uint256 i; i < entities.length; i++) _dec(entities[i], value);
  }

  function dec(uint256[] memory entities, uint256[] memory values) external virtual onlyWriter {
    require(entities.length == values.length, "arr length mismatch");
    for (uint256 i; i < entities.length; i++) _dec(entities[i], values[i]);
  }

  function get(uint256 entity) external view virtual returns (uint256) {
    return TypeLib.decodeUint256(_getRaw(entity));
  }

  function get(uint256[] memory entities) external view virtual returns (uint256[] memory) {
    return TypeLib.decodeBatchUint256(_getRaw(entities));
  }

  function safeGet(uint256 entity) external view virtual returns (uint256) {
    return TypeLib.safeDecodeUint256(_getRaw(entity));
  }

  function safeGet(uint256[] memory entities) external view virtual returns (uint256[] memory) {
    return TypeLib.safeDecodeBatchUint256(_getRaw(entities));
  }

  // not implemented in bare components. here for interface
  function getEntitiesWithValue(uint256 value) external view virtual returns (uint256[] memory) {
    revert BareComponent__NotImplemented();
  }

  function _inc(uint256 entity, uint256 value) internal virtual {
    _set(entity, TypeLib.encodeUint256(TypeLib.safeDecodeUint256(_getRaw(entity)) + value));
  }

  function _dec(uint256 entity, uint256 value) internal virtual {
    _set(entity, TypeLib.encodeUint256(TypeLib.safeDecodeUint256(_getRaw(entity)) - value));
  }
}
