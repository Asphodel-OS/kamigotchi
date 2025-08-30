// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "solecs/components/Uint256BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.Time.LastAction"));

// the timestamp of the last Standard Action taken
// Standard Actions are actions intentionally throttled by time or energy
/// @dev no longer used for Kami (was used for cooldown), only accounts (stamina calcs)
contract TimeLastActionComponent is Uint256BareComponent {
  constructor(address world) Uint256BareComponent(world, ID) {}
}
