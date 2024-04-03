// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/types/BoolComponent.sol";

uint256 constant ID = uint256(keccak256("component.Is.Register"));

// Identifies an entity as a register. A Register is an entity that can hold
// inventory slots on behalf of another entity. Most notably used in Trade.
contract IsRegisterComponent is BoolComponent {
  constructor(address world) BoolComponent(world, ID) {}
}
