// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;
import "solecs/BareComponent.sol";
import { TypeLib } from "solecs/components/types/standard.sol";

contract Int32BareComponent is BareComponent {
  constructor(address world, uint256 id) BareComponent(world, id) {}

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

  function inc(uint256 entity, int32 value) external virtual onlyWriter {
    _inc(entity, value);
  }

  function inc(uint256[] memory entities, int32 value) external virtual onlyWriter {
    for (uint256 i; i < entities.length; i++) _inc(entities[i], value);
  }

  function inc(uint256[] memory entities, int32[] memory values) external virtual onlyWriter {
    require(entities.length == values.length, "arr length mismatch");
    for (uint256 i; i < entities.length; i++) _inc(entities[i], values[i]);
  }

  function dec(uint256 entity, int32 value) external virtual onlyWriter {
    _dec(entity, value);
  }

  function dec(uint256[] memory entities, int32 value) external virtual onlyWriter {
    for (uint256 i; i < entities.length; i++) _dec(entities[i], value);
  }

  function dec(uint256[] memory entities, int32[] memory values) external virtual onlyWriter {
    require(entities.length == values.length, "arr length mismatch");
    for (uint256 i; i < entities.length; i++) _dec(entities[i], values[i]);
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

  function _inc(uint256 entity, int32 value) internal virtual {
    _set(entity, TypeLib.encodeInt32(TypeLib.safeDecodeInt32(_getRaw(entity)) + value));
  }

  function _dec(uint256 entity, int32 value) internal virtual {
    _set(entity, TypeLib.encodeInt32(TypeLib.safeDecodeInt32(_getRaw(entity)) - value));
  }
}
