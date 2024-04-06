// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "solecs/BareComponent.sol";

// PreciseValue is a struct that holds a value that requires precision in calculations
struct PreciseValue {
  int32 value;
  uint8 precision;
}

contract PreciseValueComponent is BareComponent {
  constructor(address world, uint256 id) BareComponent(world, id) {}

  function getSchema()
    public
    pure
    override
    returns (string[] memory keys, LibTypes.SchemaValue[] memory values)
  {
    keys = new string[](2);
    values = new LibTypes.SchemaValue[](2);

    keys[0] = "value";
    values[0] = LibTypes.SchemaValue.INT32;

    keys[1] = "precision";
    values[1] = LibTypes.SchemaValue.UINT8;
  }

  function set(uint256 entity, PreciseValue memory value) public onlyWriter {
    _set(entity, abi.encode(value));
  }

  function setBatch(uint256[] memory entities, PreciseValue[] memory values) public virtual {
    bytes[] memory rawValues = new bytes[](entities.length);
    for (uint256 i = 0; i < entities.length; i++) rawValues[i] = abi.encode(values[i]);

    setBatch(entities, rawValues);
  }

  function extract(uint256 entity) public virtual returns (PreciseValue memory) {
    return abi.decode(extractRaw(entity), (PreciseValue));
  }

  function extractBatch(uint256[] memory entities) public virtual returns (PreciseValue[] memory) {
    bytes[] memory rawValues = extractRawBatch(entities);
    PreciseValue[] memory values = new PreciseValue[](entities.length);
    for (uint256 i = 0; i < entities.length; i++)
      values[i] = abi.decode(rawValues[i], (PreciseValue));
    return values;
  }

  function get(uint256 entity) public view virtual returns (PreciseValue memory) {
    return abi.decode(getRaw(entity), (PreciseValue));
  }

  function getBatch(uint256[] memory entities) public view virtual returns (PreciseValue[] memory) {
    bytes[] memory rawValues = getRawBatch(entities);
    PreciseValue[] memory values = new PreciseValue[](entities.length);
    for (uint256 i = 0; i < entities.length; i++)
      values[i] = abi.decode(rawValues[i], (PreciseValue));
    return values;
  }
}
