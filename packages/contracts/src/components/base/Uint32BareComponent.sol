// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "solecs/BareComponent.sol";
import { TypeLib } from "components/types/standard.sol";

contract Uint32BareComponent is BareComponent {
  constructor(address world, uint256 id) BareComponent(world, id) {}

  function set(uint256 entity, uint32 value) external virtual onlyWriter {
    _set(entity, TypeLib.encodeUint32(value));
  }

  function setBatch(uint256[] memory entities, uint32[] memory values) external virtual onlyWriter {
    _setBatch(entities, TypeLib.encodeBatch(values));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (uint32) {
    return TypeLib.decodeUint32(_extractRaw(entity));
  }

  function extractBatch(
    uint256[] memory entities
  ) external virtual onlyWriter returns (uint32[] memory) {
    return TypeLib.decodeBatchUint32(_extractRawBatch(entities));
  }

  function get(uint256 entity) external view virtual returns (uint32) {
    return TypeLib.decodeUint32(_getRaw(entity));
  }

  function getBatch(uint256[] memory entities) external view virtual returns (uint32[] memory) {
    return TypeLib.decodeBatchUint32(_getRawBatch(entities));
  }
}
