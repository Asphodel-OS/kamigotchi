// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "solecs/components/StringBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.for.string"));

// world3: take over ForComponent
contract ForStringComponent is StringBareComponent {
  constructor(address world) StringBareComponent(world, ID) {}
}
