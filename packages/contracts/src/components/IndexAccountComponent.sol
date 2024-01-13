// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "std-contracts/components/Uint256Component.sol";

uint256 constant ID = uint256(keccak256("component.Index.Account"));

// Auto-incremented index of an Account
contract IndexAccountComponent is Uint256Component {
  constructor(address world) Uint256Component(world, ID) {}
}
