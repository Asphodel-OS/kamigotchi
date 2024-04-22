// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @notice a temporary library for until solady gets updated with these (vector pls approve)
library SafeCastLib {
  error Overflow();

  function toInt256(uint256 x) internal pure returns (int256) {
    if (x >= 1 << 255) _revertOverflow();
    return int256(x);
  }

  function toInt32(uint256 x) internal pure returns (int32) {
    if (x >= 1 << 31) _revertOverflow();
    return int32(int256(x));
  }

  function toUint256(int256 x) internal pure returns (uint256) {
    if (x < 0) _revertOverflow();
    return uint256(x);
  }

  function _revertOverflow() private pure {
    /// @solidity memory-safe-assembly
    assembly {
      // Store the function selector of `Overflow()`.
      mstore(0x00, 0x35278d12)
      // Revert with (offset, size).
      revert(0x1c, 0x04)
    }
  }
}
