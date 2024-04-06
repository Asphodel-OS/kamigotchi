// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "solecs/BareComponent.sol";

// Stat is a struct that holds the modifying values of a core stat.
// Total = (1 + boost) * (base + shift)
struct Stat {
  int32 base;
  int32 shift; // fixed +/- shift on the base stat
  int32 boost; // % multiplier on post-shifted stat (3 decimals of precision)
  int32 sync; // the last synced value of stat (optional, for depletable stats)
}

// on registry traits
// - trait stats should only maintain a base value
// - on instantiation these base values are added to the target's stat.base value
// - sync value of depletable stats like hp and slots are inferred by total base value

// on consumable registry-items
// - base value updates the target's stat.shift value (e.g. perma stat boost items)
// - sync value updates the target's stat.sync value (e.g. potions)

// on nonfungible items (e.g. equipment)
// - item instance tracks its own base, shift, boost and sync values
// - shift and boost start at 0 and are upgradable
// - sync only makes sense for depletable stats like slots and durability
// - how overall stats are computed with equipment has yet to be determined

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

    keys[2] = "boost";
    values[2] = LibTypes.SchemaValue.INT32;

    keys[3] = "sync";
    values[3] = LibTypes.SchemaValue.INT32;
  }

  function set(uint256 entity, Stat memory value) public onlyWriter {
    _set(entity, abi.encode(value));
  }

  function setBatch(uint256[] memory entities, Stat[] memory values) public virtual {
    bytes[] memory rawValues = new bytes[](entities.length);
    for (uint256 i = 0; i < entities.length; i++) rawValues[i] = abi.encode(values[i]);

    setBatch(entities, rawValues);
  }

  function extract(uint256 entity) public virtual returns (Stat memory) {
    return abi.decode(extractRaw(entity), (Stat));
  }

  function extractBatch(uint256[] memory entities) public virtual returns (Stat[] memory) {
    bytes[] memory rawValues = extractRawBatch(entities);
    Stat[] memory values = new Stat[](entities.length);
    for (uint256 i = 0; i < entities.length; i++) values[i] = abi.decode(rawValues[i], (Stat));
    return values;
  }

  function get(uint256 entity) public view virtual returns (Stat memory) {
    return abi.decode(getRaw(entity), (Stat));
  }

  function getBatch(uint256[] memory entities) public view virtual returns (Stat[] memory) {
    bytes[] memory rawValues = getRawBatch(entities);
    Stat[] memory values = new Stat[](entities.length);
    for (uint256 i = 0; i < entities.length; i++) values[i] = abi.decode(rawValues[i], (Stat));
    return values;
  }

  // calculate the stat total = ((1 + boost) * (base + shift))
  function calcTotal(uint256 entity) public view virtual returns (int32) {
    Stat memory value = get(entity);
    int32 total = ((1e3 + value.boost) * (value.base + value.shift)) / 1e3;
    return (total > 0) ? total : int32(0);
  }

  // adjust the shift value of the stat.
  function shift(uint256 entity, int32 amt) public onlyWriter returns (int32) {
    Stat memory value = get(entity);
    value.shift += amt;
    _set(entity, abi.encode(value));
    return value.shift;
  }

  // adjust the boost value of the stat. an adjustment on baseline 1000 (100.0%)
  function boost(uint256 entity, int32 amt) public onlyWriter returns (int32) {
    Stat memory value = get(entity);
    value.boost += amt;
    _set(entity, abi.encode(value));
    return value.boost;
  }

  // adjust the sync value of the stat. bound result between [0, calcTotal()]
  function sync(uint256 entity, int32 amt) public onlyWriter returns (int32) {
    Stat memory value = get(entity);
    return sync(entity, amt, calcTotal(entity));
  }

  // adjust the sync value of the stat with a specified max value
  function sync(uint256 entity, int32 amt, int32 max) public onlyWriter returns (int32) {
    Stat memory value = get(entity);

    value.sync += amt;
    if (value.sync < 0) value.sync = 0;
    if (value.sync > max) value.sync = max;
    _set(entity, abi.encode(value));
    return value.sync;
  }
}
