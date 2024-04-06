// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "std-contracts/components/Uint256Component.sol";

uint256 constant ID = uint256(keccak256("component.Id.Condition.Owns"));

// A reference to a Condition entity's owner ID. Used to represent object ownership in the world
contract IdOwnsConditionComponent is Uint256Component {
  constructor(address world) Uint256Component(world, ID) {}
}
