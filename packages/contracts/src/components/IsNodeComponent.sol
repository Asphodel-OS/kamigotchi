// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "std-contracts/components/BoolBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.Is.Node"));

// identifies an entity as a resource Node
contract IsNodeComponent is BoolBareComponent {
  constructor(address world) BoolBareComponent(world, ID) {}
}
