// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @notice a general utility library for memory array operations
library LibArray {
  /////////////////
  // SHAPES

  function add(uint256[] memory arr, uint256[] memory toAdd) internal pure {
    for (uint256 i; i < arr.length && i < toAdd.length; i++) arr[i] += toAdd[i];
  }

  function multiply(uint256[] memory arr, uint256 amt) internal pure {
    for (uint256 i; i < arr.length; i++) arr[i] *= amt;
  }

  function concat(uint256[] memory a, uint256[] memory b) internal pure returns (uint256[] memory) {
    uint256[] memory result = new uint256[](a.length + b.length);
    for (uint256 i = 0; i < a.length; i++) result[i] = a[i];
    for (uint256 i = 0; i < b.length; i++) result[a.length + i] = b[i];
    return result;
  }

  function push(uint256[] memory arr, uint256 value) internal pure returns (uint256[] memory) {
    uint256[] memory result = new uint256[](arr.length + 1);
    for (uint256 i = 0; i < arr.length; i++) result[i] = arr[i];
    result[arr.length] = value;
    return result;
  }

  /// @notice returns an array with the first X elements
  function resize(uint256[] memory arr, uint256 size) internal pure returns (uint256[] memory) {
    uint256[] memory result = new uint256[](size);
    for (uint256 i; i < size; i++) result[i] = arr[i];
    return result;
  }
}
