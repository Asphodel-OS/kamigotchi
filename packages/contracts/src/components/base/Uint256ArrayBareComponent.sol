// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "solecs/BareComponent.sol";
import { TypeLib } from "components/types/standard.sol";

contract Uint256ArrayBareComponent is BareComponent {
  constructor(address world, uint256 id) BareComponent(world, id) {}

  function set(uint256 entity, uint256[] memory value) external virtual onlyWriter {
    _set(entity, TypeLib.encodeUint256Array(value));
  }

  function setBatch(
    uint256[] memory entities,
    uint256[][] memory values
  ) external virtual onlyWriter {
    _setBatch(entities, TypeLib.encodeBatch(values));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (uint256[] memory) {
    return TypeLib.decodeUint256Array(_extractRaw(entity));
  }

  function extractBatch(
    uint256[] memory entities
  ) external virtual onlyWriter returns (uint256[][] memory) {
    return TypeLib.decodeBatchUint256Array(_extractRawBatch(entities));
  }

  function get(uint256 entity) external view virtual returns (uint256[] memory) {
    return TypeLib.decodeUint256Array(_getRaw(entity));
  }

  function getBatch(uint256[] memory entities) external view virtual returns (uint256[][] memory) {
    return TypeLib.decodeBatchUint256Array(_getRawBatch(entities));
  }
}
