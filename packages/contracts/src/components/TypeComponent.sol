// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "solecs/components/StringBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.type"));

// The Type of an entity. On Registries this is for taxonomization but the
// field can be extended to other use cases
contract TypeComponent is StringBareComponent {
  constructor(address world) StringBareComponent(world, ID) {}
}
