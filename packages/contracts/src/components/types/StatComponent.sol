// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "solecs/BareComponent.sol";

// Stat is a struct that holds the modifying values of a core stat.
// Total = (1 + mult) * (base + shift)
struct Stat {
  int32 base;
  int32 shift; // fixed shift on the base stat
  int32 mult; // % adjustment on shifted stat, 3 decimals of precision
  int32 last; // the last seen value of the stat (optional, for depleting stats like hp)
}

contract StatComponent is BareComponent {
  constructor(address world, uint256 id) BareComponent(world, id) {}

  function getSchema()
    public
    pure
    override
    returns (string[] memory keys, LibTypes.SchemaValue[] memory values)
  {
    keys = new string[](4);
    values = new LibTypes.SchemaValue[](4);

    keys[0] = "base";
    values[0] = LibTypes.SchemaValue.INT32;

    keys[1] = "shift";
    values[1] = LibTypes.SchemaValue.INT32;

    keys[2] = "mult";
    values[2] = LibTypes.SchemaValue.INT32;

    keys[3] = "last";
    values[3] = LibTypes.SchemaValue.INT32;
  }

  function set(uint256 entity, Stat memory value) public {
    set(entity, abi.encode(value));
  }

  function getValue(uint256 entity) public view virtual returns (Stat memory) {
    Stat memory value = abi.decode(getRawValue(entity), (Stat));
    return value;
  }

  function calcTotal(uint256 entity) public view virtual returns (int32) {
    Stat memory value = getValue(entity);
    int32 total = ((value.mult + 1e3) * (value.base + value.shift)) / 1e3;
    return (total > 0) ? total : 0;
  }

  function adjustBase(uint256 entity, int32 amt) public returns (int32) {
    Stat memory value = getValue(entity);
    value.base += amt;
    set(entity, value);
    return value.base;
  }

  function adjustShift(uint256 entity, int32 amt) public returns (int32) {
    Stat memory value = getValue(entity);
    value.shift += amt;
    set(entity, value);
    return value.shift;
  }

  function adjustMult(uint256 entity, int32 amt) public returns (int32) {
    Stat memory value = getValue(entity);
    value.mult += amt;
    set(entity, value);
    return value.mult;
  }

  function adjustLast(uint256 entity, int32 amt) public returns (int32) {
    Stat memory value = getValue(entity);
    int32 total = calcTotal(entity);

    value.last += amt;
    if (value.last < 0) value.last = 0;
    if (value.last > total) value.last = total;
    set(entity, value);
    return value.last;
  }
}
