// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "components/types/StatComponent.sol";

uint256 constant ID = uint256(keccak256("component.stat.stamina"));

// the total stamina of an entity
contract StaminaComponent is StatComponent {
  constructor(address world) StatComponent(world, ID) {}
}
