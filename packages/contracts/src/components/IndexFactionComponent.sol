// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "solecs/components/Uint32BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.index.faction"));

// represents the human-set Node Index on a Node entity
contract IndexFactionComponent is Uint32BareComponent {
  constructor(address world) Uint32BareComponent(world, ID) {}
}
