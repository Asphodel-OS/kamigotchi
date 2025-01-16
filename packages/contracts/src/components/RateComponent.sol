// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "solecs/components/Uint256BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.rate"));

// the rate of something. precisions can be set arbitrarily within libraries
contract RateComponent is Uint256BareComponent {
  constructor(address world) Uint256BareComponent(world, ID) {}
}
