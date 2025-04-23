// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "solecs/components/BoolBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.is.disabled"));

contract IsDisabledComponent is BoolBareComponent {
  constructor(address world) BoolBareComponent(world, ID) {}
}
