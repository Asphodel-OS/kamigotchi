// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "solecs/components/Int32BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.compound"));

contract CompoundComponent is Int32BareComponent {
  constructor(address world) Int32BareComponent(world, ID) {}
}
