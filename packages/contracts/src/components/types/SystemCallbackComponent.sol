// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { LibTypes } from "solecs/LibTypes.sol";
import { Component } from "solecs/Component.sol";

import { SystemCallback, executeSystemCallback } from "./SystemCallbackBareComponent.sol";

contract SystemCallbackComponent is Component {
  constructor(address world, uint256 id) Component(world, id) {}

  function getSchema()
    public
    pure
    override
    returns (string[] memory keys, LibTypes.SchemaValue[] memory values)
  {
    keys = new string[](2);
    values = new LibTypes.SchemaValue[](2);

    keys[0] = "systemId";
    values[0] = LibTypes.SchemaValue.UINT256;

    keys[1] = "args";
    values[1] = LibTypes.SchemaValue.BYTES;
  }

  function set(uint256 entity, SystemCallback memory value) public virtual {
    set(entity, abi.encode(value));
  }

  function setBatch(uint256[] memory entities, SystemCallback[] memory values) public virtual {
    bytes[] memory rawValues = new bytes[](entities.length);
    for (uint256 i = 0; i < entities.length; i++) rawValues[i] = abi.encode(values[i]);

    setBatch(entities, rawValues);
  }

  function extract(uint256 entity) public virtual returns (SystemCallback memory) {
    return abi.decode(extractRaw(entity), (SystemCallback));
  }

  function extractBatch(
    uint256[] memory entities
  ) public virtual returns (SystemCallback[] memory) {
    bytes[] memory rawValues = extractRawBatch(entities);
    SystemCallback[] memory values = new SystemCallback[](entities.length);
    for (uint256 i = 0; i < entities.length; i++)
      values[i] = abi.decode(rawValues[i], (SystemCallback));
    return values;
  }

  function get(uint256 entity) public view virtual returns (SystemCallback memory) {
    return abi.decode(getRaw(entity), (SystemCallback));
  }

  function getBatch(
    uint256[] memory entities
  ) public view virtual returns (SystemCallback[] memory) {
    bytes[] memory rawValues = getRawBatch(entities);
    SystemCallback[] memory values = new SystemCallback[](entities.length);
    for (uint256 i = 0; i < entities.length; i++)
      values[i] = abi.decode(rawValues[i], (SystemCallback));
    return values;
  }

  function getEntitiesWithValue(
    SystemCallback memory value
  ) public view virtual returns (uint256[] memory) {
    return getEntitiesWithValue(abi.encode(value));
  }
}
