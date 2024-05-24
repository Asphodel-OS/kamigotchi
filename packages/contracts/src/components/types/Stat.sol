// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

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

library StatLib {
  function encode(Stat memory stat) internal pure returns (bytes memory) {
    return abi.encode(toUint(stat));
  }

  function encodeBatch(Stat[] memory stats) internal pure returns (bytes[] memory) {
    bytes[] memory encoded = new bytes[](stats.length);
    for (uint256 i = 0; i < stats.length; i++) encoded[i] = encode(stats[i]);
    return encoded;
  }

  function toUint(Stat memory stat) internal pure returns (uint256) {
    return
      (uint256(uint32(stat.base)) << 192) |
      (uint256(uint32(stat.shift)) << 128) |
      (uint256(uint32(stat.boost)) << 64) |
      uint256(uint32(stat.sync));
  }

  function toStat(uint256 value) internal pure returns (Stat memory) {
    return
      Stat(
        int32(int((value >> 192) & 0xFFFFFFFFFFFFFFFF)),
        int32(int((value >> 128) & 0xFFFFFFFFFFFFFFFF)),
        int32(int((value >> 64) & 0xFFFFFFFFFFFFFFFF)),
        int32(int((value) & 0xFFFFFFFFFFFFFFFF))
      );
  }
}
