// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

library Strings {
  function equal(string memory a, string memory b) internal pure returns (bool) {
    return keccak256(abi.encode(a)) == keccak256(abi.encode(b));
  }
}
