// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "std-contracts/components/BoolBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.Is.Relationship"));

// identifies an entity as Relationship entry
contract IsRelationshipComponent is BoolBareComponent {
  constructor(address world) BoolBareComponent(world, ID) {}
}
