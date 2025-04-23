// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "solecs/components/StringBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.description.alt"));

// A second description component. For use if needed
contract DescriptionAltComponent is StringBareComponent {
  constructor(address world) StringBareComponent(world, ID) {}
}
