// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { TypeLib } from "solecs/components/types/standard.sol";

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

// Stats are stored as uint256 components. Uses TypeLib for uint256 encoding/decoding.
library StatLib {
  ///////////////
  // CALCS

  function deprecatedCalcTotal(Stat memory value) internal pure returns (int32) {
    int32 total = ((1e3 + value.boost) * (value.base + value.shift)) / 1e3;
    return (total > 0) ? total : int32(0);
  }

  function shift(Stat memory value, int32 amt) internal pure returns (int32) {
    return value.shift + amt;
  }

  function boost(Stat memory value, int32 amt) internal pure returns (int32) {
    return value.boost + amt;
  }

  function deprecatedSync(Stat memory value, int32 amt, int32 max) internal pure returns (int32) {
    value.sync += amt;
    if (value.sync < 0) value.sync = 0;
    if (value.sync > max) value.sync = max;
    return value.sync;
  }

  ///////////////
  // CHECKS

  function isEqual(Stat memory a, Stat memory b) internal pure returns (bool) {
    return a.base == b.base && a.shift == b.shift && a.boost == b.boost && a.sync == b.sync;
  }

  function isZero(Stat memory value) internal pure returns (bool) {
    return value.base == 0 && value.shift == 0 && value.boost == 0 && value.sync == 0;
  }

  ///////////////
  // ENCODING

  function encode(Stat memory stat) internal pure returns (bytes memory) {
    return TypeLib.encodeUint256(toUint(stat));
  }

  function encodeBatch(Stat[] memory stats) internal pure returns (bytes[] memory) {
    bytes[] memory encoded = new bytes[](stats.length);
    for (uint256 i = 0; i < stats.length; i++) encoded[i] = encode(stats[i]);
    return encoded;
  }

  function decode(bytes memory encoded) internal pure returns (Stat memory) {
    return toStat(TypeLib.decodeUint256(encoded));
  }

  function decodeBatch(bytes[] memory encoded) internal pure returns (Stat[] memory) {
    Stat[] memory stats = new Stat[](encoded.length);
    for (uint256 i = 0; i < encoded.length; i++) stats[i] = decode(encoded[i]);
    return stats;
  }

  function safeDecode(bytes memory encoded) internal pure returns (Stat memory) {
    return toStat(TypeLib.safeDecodeUint256(encoded));
  }

  function safeDecodeBatch(bytes[] memory encoded) internal pure returns (Stat[] memory) {
    Stat[] memory stats = new Stat[](encoded.length);
    for (uint256 i = 0; i < encoded.length; i++) stats[i] = safeDecode(encoded[i]);
    return stats;
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
