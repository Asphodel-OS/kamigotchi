// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/types/Uint256Component.sol";

uint256 constant ID = uint256(keccak256("component.id.inventory.owns"));

// A reference to a Inventory entity's owner ID. Used to represent object ownership in the world
contract IdOwnsInventoryComponent is Uint256Component {
  constructor(address world) Uint256Component(world, ID) {}
}
