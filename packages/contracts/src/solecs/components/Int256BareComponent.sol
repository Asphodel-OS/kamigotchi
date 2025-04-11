// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;
import "solecs/BareComponent.sol";
import { TypeLib } from "solecs/components/types/standard.sol";

contract Int256BareComponent is BareComponent {
  constructor(address world, uint256 id) BareComponent(world, id) {}

  function set(uint256 entity, int256 value) external virtual onlyWriter {
    _set(entity, TypeLib.encodeInt256(value));
  }

  function set(uint256[] memory entities, int256[] memory values) external virtual onlyWriter {
    _set(entities, TypeLib.encodeBatch(values));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (int256) {
    return TypeLib.decodeInt256(_extractRaw(entity));
  }

  function extract(
    uint256[] memory entities
  ) external virtual onlyWriter returns (int256[] memory) {
    return TypeLib.decodeBatchInt256(_extractRaw(entities));
  }

  function inc(uint256 entity, int256 value) external virtual onlyWriter {
    _inc(entity, value);
  }

  function inc(uint256[] memory entities, int256 value) external virtual onlyWriter {
    for (uint256 i; i < entities.length; i++) _inc(entities[i], value);
  }

  function inc(uint256[] memory entities, int256[] memory values) external virtual onlyWriter {
    require(entities.length == values.length, "arr length mismatch");
    for (uint256 i; i < entities.length; i++) _inc(entities[i], values[i]);
  }

  function dec(uint256 entity, int256 value) external virtual onlyWriter {
    _dec(entity, value);
  }

  function dec(uint256[] memory entities, int256 value) external virtual onlyWriter {
    for (uint256 i; i < entities.length; i++) _dec(entities[i], value);
  }

  function dec(uint256[] memory entities, int256[] memory values) external virtual onlyWriter {
    require(entities.length == values.length, "arr length mismatch");
    for (uint256 i; i < entities.length; i++) _dec(entities[i], values[i]);
  }

  function get(uint256 entity) external view virtual returns (int256) {
    return TypeLib.decodeInt256(_getRaw(entity));
  }

  function get(uint256[] memory entities) external view virtual returns (int256[] memory) {
    return TypeLib.decodeBatchInt256(_getRaw(entities));
  }

  function safeGet(uint256 entity) external view virtual returns (int256) {
    return TypeLib.safeDecodeInt256(_getRaw(entity));
  }

  function safeGet(uint256[] memory entities) external view virtual returns (int256[] memory) {
    return TypeLib.safeDecodeBatchInt256(_getRaw(entities));
  }

  function _inc(uint256 entity, int256 value) internal virtual {
    _set(entity, TypeLib.encodeInt256(TypeLib.safeDecodeInt256(_getRaw(entity)) + value));
  }

  function _dec(uint256 entity, int256 value) internal virtual {
    _set(entity, TypeLib.encodeInt256(TypeLib.safeDecodeInt256(_getRaw(entity)) - value));
  }
}
