// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "solecs/components/StatComponent.sol";

uint256 constant ID = uint256(keccak256("component.stat.health"));

// the health stat of an entity, composed of base, shift, mult, last (optional)
contract HealthComponent is StatComponent {
  constructor(address world) StatComponent(world, ID) {}
}
