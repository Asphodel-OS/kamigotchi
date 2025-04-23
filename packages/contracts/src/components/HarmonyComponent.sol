// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "solecs/components/StatComponent.sol";

uint256 constant ID = uint256(keccak256("component.stat.harmony"));

// Harmony stat of a kami, equip or mod. Harmony is the defense against violence.
contract HarmonyComponent is StatComponent {
  constructor(address world) StatComponent(world, ID) {}
}
