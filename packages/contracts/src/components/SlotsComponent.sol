// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "components/types/StatComponent.sol";

uint256 constant ID = uint256(keccak256("component.stat.slots"));

// the number of base mod slots on a kami or equipment
contract SlotsComponent is StatComponent {
  constructor(address world) StatComponent(world, ID) {}
}
