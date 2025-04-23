// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;
import "solecs/components/Uint256BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.id.holder"));

// A reference to a Holder entity's ID. Used to represent object ownership in the world
contract IdHolderComponent is Uint256BareComponent {
  constructor(address world) Uint256BareComponent(world, ID) {}
}
