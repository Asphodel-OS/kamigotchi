// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "solecs/components/StringBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.description"));

// The Description of an entity, used to inform the FE
contract DescriptionComponent is StringBareComponent {
  constructor(address world) StringBareComponent(world, ID) {}
}
