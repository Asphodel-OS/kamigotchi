// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;
import "solecs/components/BoolBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.is.kill"));

// todo: world2: refactor skill log
// identifies an entity as a kill log instance
contract IsKillComponent is BoolBareComponent {
  constructor(address world) BoolBareComponent(world, ID) {}
}
