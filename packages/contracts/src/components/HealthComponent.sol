// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "components/base/StatComponent.sol";

uint256 constant ID = uint256(keccak256("component.stat.health"));

// the health stat of an entity, composed of base, shift, mult, last (optional)
contract HealthComponent is StatComponent {
  constructor(address world) StatComponent(world, ID) {}
}
