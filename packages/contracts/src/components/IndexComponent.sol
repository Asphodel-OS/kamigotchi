// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;
import "solecs/components/Uint32BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.index"));

// generic index component for when another component (e.g. type) makes clear
// what the index should be referencing
contract IndexComponent is Uint32BareComponent {
  constructor(address world) Uint32BareComponent(world, ID) {}
}
