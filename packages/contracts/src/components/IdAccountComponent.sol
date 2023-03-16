// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "std-contracts/components/Uint256Component.sol";

uint256 constant ID = uint256(keccak256("component.Id.Account"));

// a reference to a Account entity's ID
contract IdAccountComponent is Uint256Component {
  constructor(address world) Uint256Component(world, ID) {}
}
