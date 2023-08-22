// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "std-contracts/components/Uint256Component.sol";

uint256 constant ID = uint256(keccak256("component.Index"));

// generic index component for when another component (e.g. type) makes clear
// what the index should be referencing
contract IndexComponent is Uint256Component {
  constructor(address world) Uint256Component(world, ID) {}
}
