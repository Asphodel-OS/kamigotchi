// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;
import "solecs/components/Uint256Component.sol";

uint256 constant ID = uint256(keccak256("component.id.inventory.owns"));

// A reference to a Inventory entity's owner ID. Used to represent object ownership in the world
contract IDOwnsInventoryComponent is Uint256Component {
  constructor(address world) Uint256Component(world, ID) {}
}
