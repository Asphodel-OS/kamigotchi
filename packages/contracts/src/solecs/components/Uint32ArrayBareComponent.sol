// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;
import "solecs/BareComponent.sol";
import { TypeLib } from "solecs/components/types/standard.sol";

contract Uint32ArrayBareComponent is BareComponent {
  constructor(address world, uint256 id) BareComponent(world, id) {}

  function set(uint256 entity, uint32[] memory value) external virtual onlyWriter {
    _set(entity, TypeLib.encodeUint32Array(value));
  }

  function set(uint256[] memory entities, uint32[][] memory values) external virtual onlyWriter {
    _set(entities, TypeLib.encodeBatch(values));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (uint32[] memory) {
    return TypeLib.decodeUint32Array(_extractRaw(entity));
  }

  function extract(
    uint256[] memory entities
  ) external virtual onlyWriter returns (uint32[][] memory) {
    return TypeLib.decodeBatchUint32Array(_extractRaw(entities));
  }

  function get(uint256 entity) external view virtual returns (uint32[] memory) {
    return TypeLib.decodeUint32Array(_getRaw(entity));
  }

  function get(uint256[] memory entities) external view virtual returns (uint32[][] memory) {
    return TypeLib.decodeBatchUint32Array(_getRaw(entities));
  }

  function safeGet(uint256 entity) external view virtual returns (uint32[] memory) {
    return TypeLib.safeDecodeUint32Array(_getRaw(entity));
  }

  function safeGet(uint256[] memory entities) external view virtual returns (uint32[][] memory) {
    return TypeLib.safeDecodeBatchUint32Array(_getRaw(entities));
  }
}
