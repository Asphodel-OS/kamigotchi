// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;
import "solecs/components/Uint32BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.index.color"));

// Body is a trait, non-fungible
contract IndexColorComponent is Uint32BareComponent {
  constructor(address world) Uint32BareComponent(world, ID) {}
}
