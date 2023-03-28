// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/console.sol";

library LibRandom {
  //////////////////
  // BITPACKED

  // @dev: updates a bitpacked value at a specific position. returns the new packed array
  // @param newElement: the new value to set
  // @param position: the position to set
  // @param maxPos: the number of elements in array
  // @param SIZE: the size of each element (eg 8 for uint8, which allows for 32 values packed)
  // @param packed: the original packed value
  function _bpUpdateIndividual(
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

  // generates a non-weighted random bitpacked array from a seed
  // it uses a MaxElements packed array to determine the max value for each element
  // MaxElements can be generated
  function _bpGenerateFromSeed(
    uint256 seed,
    uint256 pMax,
    uint256 numElements,
    uint256 SIZE
  ) internal pure returns (uint256) {
    // only take set number of elements
    seed = seed & ((1 << (SIZE * numElements)) - 1);

    // iterate to generate result
    uint256 result;
    for (uint256 i; i < numElements; i++) {
      // non-defult items always have a max 0
      uint256 cMax = (pMax >> (SIZE * i)) & ((1 << SIZE) - 1);
      uint256 cSeed = (seed >> (SIZE * i)) & ((1 << SIZE) - 1);

      // skip if 0
      if (cMax == 0) {
        result = result << SIZE;
        continue;
      }

      result = (result << SIZE) | ((cSeed % cMax) + 1);
    }

    return result;
  }

  // converts a regular array to a bitpacked array
  function _arrayToPacked(uint256[] memory arr, uint256 SIZE) internal pure returns (uint256) {
    uint256 result;
    for (uint256 i; i < arr.length; i++) {
      require(arr[i] < (1 << SIZE) - 1, "max over limit");
      result = (result << SIZE) | arr[i];
    }

    return result;
  }

  // converts a bitpacked array to a regular array
  function _packedToArray(
    uint256 packed,
    uint256 numElements,
    uint256 SIZE
  ) internal pure returns (uint256[] memory) {
    uint256[] memory result = new uint256[](numElements);

    for (uint256 i; i < numElements; i++) {
      // packed order is reversed
      // result[numElements-1-i] = packed & ((1 << SIZE) - 1);
      result[i] = packed & ((1 << SIZE) - 1);

      packed = packed >> SIZE;
    }

    return result;
  }
}
