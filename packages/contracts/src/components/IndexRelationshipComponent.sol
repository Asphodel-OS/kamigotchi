// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "solecs/components/Uint32BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.index.relationship"));

// represents the human-set Relationship Index on a Registry entity
contract IndexRelationshipComponent is Uint32BareComponent {
  constructor(address world) Uint32BareComponent(world, ID) {}
}
