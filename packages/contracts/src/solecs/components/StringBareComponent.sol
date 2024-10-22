// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "solecs/BareComponent.sol";
import { TypeLib } from "solecs/components/types/standard.sol";

contract StringBareComponent is BareComponent {
  constructor(address world, uint256 id) BareComponent(world, id) {}

  function set(uint256 entity, string memory value) external virtual onlyWriter {
    _set(entity, TypeLib.encodeString(value));
  }

  function set(uint256[] memory entities, string[] memory values) external virtual onlyWriter {
    _set(entities, TypeLib.encodeBatch(values));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (string memory) {
    return TypeLib.decodeString(_extractRaw(entity));
  }

  function extract(
    uint256[] memory entities
  ) external virtual onlyWriter returns (string[] memory) {
    return TypeLib.decodeBatchString(_extractRaw(entities));
  }

  function get(uint256 entity) external view virtual returns (string memory) {
    return TypeLib.decodeString(_getRaw(entity));
  }

  function get(uint256[] memory entities) external view virtual returns (string[] memory) {
    return TypeLib.decodeBatchString(_getRaw(entities));
  }

  function safeGet(uint256 entity) external view virtual returns (string memory) {
    return TypeLib.safeDecodeString(_getRaw(entity));
  }

  function safeGet(uint256[] memory entities) external view virtual returns (string[] memory) {
    return TypeLib.safeDecodeBatchString(_getRaw(entities));
  }
}
