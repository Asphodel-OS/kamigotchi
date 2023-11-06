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

  function getValue(uint256 entity) public view virtual returns (PreciseValue memory) {
    PreciseValue memory value = abi.decode(getRawValue(entity), (PreciseValue));
    return value;
  }
}
