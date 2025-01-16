// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;
import "solecs/BareComponent.sol";
import { TypeLib } from "solecs/components/types/standard.sol";

contract AddressBareComponent is BareComponent {
  constructor(address world, uint256 id) BareComponent(world, id) {}

  function set(uint256 entity, address value) external virtual onlyWriter {
    _set(entity, TypeLib.encodeAddress(value));
  }

  function set(uint256[] memory entities, address[] memory values) external virtual onlyWriter {
    _set(entities, TypeLib.encodeBatch(values));
  }

  function extract(uint256 entity) external virtual onlyWriter returns (address) {
    return TypeLib.decodeAddress(_extractRaw(entity));
  }

  function extract(
    uint256[] memory entities
  ) external virtual onlyWriter returns (address[] memory) {
    return TypeLib.decodeBatchAddress(_extractRaw(entities));
  }

  function get(uint256 entity) external view virtual returns (address) {
    return TypeLib.decodeAddress(_getRaw(entity));
  }

  function get(uint256[] memory entities) external view virtual returns (address[] memory) {
    return TypeLib.decodeBatchAddress(_getRaw(entities));
  }

  function safeGet(uint256 entity) external view virtual returns (address) {
    return TypeLib.safeDecodeAddress(_getRaw(entity));
  }

  function safeGet(uint256[] memory entities) external view virtual returns (address[] memory) {
    return TypeLib.safeDecodeBatchAddress(_getRaw(entities));
  }
}
