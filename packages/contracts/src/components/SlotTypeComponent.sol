// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "solecs/components/StringBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.slottype"));

// The equipment slot type (e.g., "PETPET", "HAT")
contract SlotTypeComponent is StringBareComponent {
  constructor(address world) StringBareComponent(world, ID) {}
}
