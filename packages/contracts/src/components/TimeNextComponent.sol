// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "solecs/components/Uint256BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.Time.Next"));

/// @notice time based component
/// @dev primarily used for cooldowns
contract TimeNextComponent is Uint256BareComponent {
  constructor(address world) Uint256BareComponent(world, ID) {}
}
