// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "std-contracts/components/Uint256ArrayBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.Quest.Objectives"));

contract QuestObjectivesComponent is Uint256ArrayBareComponent {
  constructor(address world) Uint256ArrayBareComponent(world, ID) {}
}
