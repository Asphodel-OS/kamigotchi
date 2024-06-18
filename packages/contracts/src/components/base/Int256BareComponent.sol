// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "solecs/BareComponent.sol";
import { TypeLib } from "components/types/standard.sol";

contract Int256BareComponent is BareComponent {
  constructor(address world, uint256 id) BareComponent(world, id) {}

  function set(uint256 entity, int256 value) external virtual onlyWriter {
    _set(entity, TypeLib.encodeInt256(value));
  }

  function setBatch(uint256[] memory entities, int256[] memory values) external virtual onlyWriter {
    _setBatch(entities, TypeLib.encodeBatch(values));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (int256) {
    return TypeLib.decodeInt256(_extractRaw(entity));
  }

  function extractBatch(
    uint256[] memory entities
  ) external virtual onlyWriter returns (int256[] memory) {
    return TypeLib.decodeBatchInt256(_extractRawBatch(entities));
  }

  function get(uint256 entity) external view virtual returns (int256) {
    return TypeLib.decodeInt256(_getRaw(entity));
  }

  function getBatch(uint256[] memory entities) external view virtual returns (int256[] memory) {
    return TypeLib.decodeBatchInt256(_getRawBatch(entities));
  }
}
