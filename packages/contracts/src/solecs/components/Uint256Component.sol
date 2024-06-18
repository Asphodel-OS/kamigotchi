// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { Component } from "../Component.sol";
import { LibTypes } from "../LibTypes.sol";
import { IUint256Component } from "../interfaces/IUint256Component.sol";

/** @notice
 * SOLECS implementation of a component storing a uint256 value for each entity.
 * used for internal solecs testing; Live uint256Comp does not use this
 */
contract Uint256Component is Component, IUint256Component {
  constructor(address world, uint256 id) Component(world, id) {}

  function set(uint256 entity, uint256 value) public virtual {
    set(entity, abi.encode(value));
  }

  function setBatch(uint256[] memory entities, uint256[] memory values) public virtual {
    bytes[] memory rawValues = new bytes[](entities.length);
    for (uint256 i = 0; i < entities.length; i++) rawValues[i] = abi.encode(values[i]);

    setBatch(entities, rawValues);
  }

  function extract(uint256 entity) public virtual returns (uint256) {
    return abi.decode(extractRaw(entity), (uint256));
  }

  function extractBatch(uint256[] memory entities) public virtual returns (uint256[] memory) {
    bytes[] memory rawValues = extractRawBatch(entities);
    uint256[] memory values = new uint256[](entities.length);
    for (uint256 i = 0; i < entities.length; i++) values[i] = abi.decode(rawValues[i], (uint256));
    return values;
  }

  function get(uint256 entity) public view virtual returns (uint256) {
    return abi.decode(getRaw(entity), (uint256));
  }

  function getBatch(uint256[] memory entities) public view virtual returns (uint256[] memory) {
    bytes[] memory rawValues = getRawBatch(entities);
    uint256[] memory values = new uint256[](entities.length);
    for (uint256 i = 0; i < entities.length; i++) values[i] = abi.decode(rawValues[i], (uint256));
    return values;
  }

  function getEntitiesWithValue(uint256 value) public view virtual returns (uint256[] memory) {
    return getEntitiesWithValue(abi.encode(value));
  }
}
