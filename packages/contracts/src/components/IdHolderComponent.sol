// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/types/Uint256Component.sol";

uint256 constant ID = uint256(keccak256("component.id.holder"));

// A reference to a Holder entity's ID. Used to represent object ownership in the world
contract IdHolderComponent is Uint256Component {
  constructor(address world) Uint256Component(world, ID) {}
}
