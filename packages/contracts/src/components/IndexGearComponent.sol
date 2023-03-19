// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "std-contracts/components/Uint256Component.sol";

uint256 constant ID = uint256(keccak256("component.Index.Gear"));

// Gear is any piece of non-fungible equipment that's constrained to a single body type
// IndexGear represents the human-set Gear Index on a Registry Entity
contract IndexGearComponent is Uint256Component {
  constructor(address world) Uint256Component(world, ID) {}
}
