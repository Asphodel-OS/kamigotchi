// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "solecs/components/Int32BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.period"));

contract PeriodComponent is Int32BareComponent {
  constructor(address world) Int32BareComponent(world, ID) {}
}
