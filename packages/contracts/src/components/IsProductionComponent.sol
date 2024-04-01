// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "std-contracts/components/BoolBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.Is.Production"));

// identifies an entity as a (node) resource production
contract IsProductionComponent is BoolBareComponent {
  constructor(address world) BoolBareComponent(world, ID) {}
}
