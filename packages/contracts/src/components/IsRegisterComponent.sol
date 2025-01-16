// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;
import "solecs/components/BoolBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.is.register"));

// Identifies an entity as a register. A Register is an entity that can hold
// inventory slots on behalf of another entity. Most notably used in Trade.
contract IsRegisterComponent is BoolBareComponent {
  constructor(address world) BoolBareComponent(world, ID) {}
}
