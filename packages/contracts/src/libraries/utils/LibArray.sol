// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @notice a general utility library for memory array operations
library LibArray {
  function push(uint256[] memory arr, uint256 value) internal pure returns (uint256[] memory) {
    uint256[] memory result = new uint256[](arr.length + 1);
    for (uint256 i = 0; i < arr.length; i++) result[i] = arr[i];
    result[arr.length] = value;
    return result;
  }
}
