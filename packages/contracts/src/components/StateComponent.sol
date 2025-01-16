// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "solecs/components/StringBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.state"));

// one day we will start using enums for state..
contract StateComponent is StringBareComponent {
  constructor(address world) StringBareComponent(world, ID) {}
}
