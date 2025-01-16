// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "solecs/components/StatComponent.sol";

uint256 constant ID = uint256(keccak256("component.stat.power"));

// data harvesting power of a pet (in bytes/hr)
contract PowerComponent is StatComponent {
  constructor(address world) StatComponent(world, ID) {}
}
