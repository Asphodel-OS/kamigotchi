// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "solecs/components/Uint256BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.Time.Last"));

// the timestamp of the last occurrence of an event/update
contract TimeLastComponent is Uint256BareComponent {
  constructor(address world) Uint256BareComponent(world, ID) {}
}
