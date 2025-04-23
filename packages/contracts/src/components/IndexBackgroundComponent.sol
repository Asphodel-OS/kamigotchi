// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;
import "solecs/components/Uint32BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.index.background"));

// Body is a trait, non-fungible
contract IndexBackgroundComponent is Uint32BareComponent {
  constructor(address world) Uint32BareComponent(world, ID) {}
}
