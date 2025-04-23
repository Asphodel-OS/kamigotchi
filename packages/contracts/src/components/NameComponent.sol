// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "solecs/components/StringComponent.sol";

uint256 constant ID = uint256(keccak256("component.name"));

// assigned Name of an entity
contract NameComponent is StringComponent {
  constructor(address world) StringComponent(world, ID) {}
}
