// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "solecs/components/Uint32BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.scale"));

contract ScaleComponent is Uint32BareComponent {
  constructor(address world) Uint32BareComponent(world, ID) {}
}
