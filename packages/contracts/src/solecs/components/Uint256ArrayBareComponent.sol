// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;
import "solecs/BareComponent.sol";
import { TypeLib } from "solecs/components/types/standard.sol";

contract Uint256ArrayBareComponent is BareComponent {
  constructor(address world, uint256 id) BareComponent(world, id) {}

  function set(uint256 entity, uint256[] memory value) external virtual onlyWriter {
    _set(entity, TypeLib.encodeUint256Array(value));
  }

  function set(uint256[] memory entities, uint256[][] memory values) external virtual onlyWriter {
    _set(entities, TypeLib.encodeBatch(values));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (uint256[] memory) {
    return TypeLib.decodeUint256Array(_extractRaw(entity));
  }

  function extract(
    uint256[] memory entities
  ) external virtual onlyWriter returns (uint256[][] memory) {
    return TypeLib.decodeBatchUint256Array(_extractRaw(entities));
  }

  function get(uint256 entity) external view virtual returns (uint256[] memory) {
    return TypeLib.decodeUint256Array(_getRaw(entity));
  }

  function get(uint256[] memory entities) external view virtual returns (uint256[][] memory) {
    return TypeLib.decodeBatchUint256Array(_getRaw(entities));
  }

  function safeGet(uint256 entity) external view virtual returns (uint256[] memory) {
    return TypeLib.safeDecodeUint256Array(_getRaw(entity));
  }

  function safeGet(uint256[] memory entities) external view virtual returns (uint256[][] memory) {
    return TypeLib.safeDecodeBatchUint256Array(_getRaw(entities));
  }
}
