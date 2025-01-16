// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "solecs/components/StatComponent.sol";

uint256 constant ID = uint256(keccak256("component.stat.violence"));

// Violence stat of a kami, equip or mod. Violence allows a kami to reap others
// at higher energy capacities.
contract ViolenceComponent is StatComponent {
  constructor(address world) StatComponent(world, ID) {}
}
