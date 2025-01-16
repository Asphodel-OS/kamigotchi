// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "solecs/components/StringBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.type.entity"));

/// @notice a top level component that signals the type of shape an entity is. for registries.
contract EntityTypeComponent is StringBareComponent {
  constructor(address world) StringBareComponent(world, ID) {}
}
