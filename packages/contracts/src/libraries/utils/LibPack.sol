// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";

/// @notice a general utility library for packing and unpacking data
library LibPack {
  ////////////////////
  // STRINGS

  function stringToUint(string memory value) internal pure returns (uint256) {
    return uint256(LibString.packOne(value));
  }

  function uintToString(uint256 value) internal pure returns (string memory) {
    return LibString.unpackOne((bytes32(abi.encodePacked(value))));
  }

  ////////////////////
  // ARRAYS (PACKING)

  /// @notice converts a regular array to a bitpacked array
  function packArr(uint32[] memory arr, uint256 SIZE) internal pure returns (uint256) {
    uint256 result;
    for (uint256 i; i < arr.length; i++) {
      require(arr[i] < (1 << SIZE) - 1, "max over limit");
      result = (result << SIZE) | arr[i];
    }

    return result;
  }

  /// @notice converts a bitpacked array to a regular array
  function unpackArr(
    uint256 packed,
    uint256 numElements,
    uint256 SIZE
  ) internal pure returns (uint32[] memory) {
    uint32[] memory result = new uint32[](numElements);

    for (uint256 i; i < numElements; i++) {
      // packed order is reversed
      result[numElements - 1 - i] = uint32(packed & ((1 << SIZE) - 1));
      // result[i] = packed & ((1 << SIZE) - 1);

      packed = packed >> SIZE;
    }

    return result;
  }

  /// @notice converts a bitpacked array to a regular array, fixed size of uint32[8]
  function packArrU32(uint32[8] memory values) internal pure returns (uint256 result) {
    for (uint256 i; i < values.length; i++) {
      require(values[i] < (1 << 32) - 1, "max over limit");
      result = (result << 32) | values[i];
    }
  }

  /// @notice converts a regular array to a bitpacked array, fixed size of uint32[8]
  function unpackArrU32(uint256 packed) internal pure returns (uint32[8] memory result) {
    for (uint256 i; i < 8; i++) {
      // packed order is reversed
      result[7 - i] = uint32(packed & ((1 << 32) - 1));
      packed = packed >> 32;
    }
  }

  ////////////////////
  // ARRAYS (INTERACTIONS)

  /// @notice updates a bitpacked value at a specific position. returns the new packed array
  /// @param newElement: the new value to set
  /// @param position: the position to set
  /// @param maxPos: the number of elements in array
  /// @param SIZE: the size of each element (eg 8 for uint8, which allows for 32 values packed)
  /// @param packed: the original packed value
  function pUpdateAt(
    uint256 newElement,
    uint256 position,
    uint256 maxPos,
    uint256 SIZE,
    uint256 packed
  ) internal pure returns (uint256) {
    require(position < (256 / SIZE) && position <= maxPos, "out of bounds");
    require(newElement < (1 << SIZE), "new num out of bounds");

    return
      (packed & ~(((1 << SIZE) - 1) << (SIZE * (maxPos - position)))) |
      (newElement << (SIZE * (maxPos - position)));
  }

  /// @notice gets a bitpacked value at a specific position
  function pGetAt(
    uint256 packed,
    uint256 position,
    uint256 maxPos,
    uint256 SIZE
  ) internal pure returns (uint256) {
    return packed & (((1 << SIZE) - 1) << (SIZE * (maxPos - position)));
  }

  function pUpdateAtU32(
    uint32 newElement,
    uint256 position,
    uint256 packed
  ) internal pure returns (uint256) {
    return pUpdateAt(uint256(newElement), position, 8, 32, packed);
  }

  function pGetAtU32(uint256 packed, uint256 position) internal pure returns (uint32) {
    return uint32(pGetAt(packed, position, 8, 32));
  }
}
