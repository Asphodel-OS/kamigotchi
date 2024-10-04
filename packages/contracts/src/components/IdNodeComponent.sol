// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "solecs/components/Uint256BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.id.node"));

// world2: deprecate
// a reference to a Node entity's ID
contract IdNodeComponent is Uint256BareComponent {
  constructor(address world) Uint256BareComponent(world, ID) {}
}
