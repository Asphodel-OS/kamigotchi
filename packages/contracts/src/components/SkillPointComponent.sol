// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "solecs/components/Uint256BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.skill.point"));

// the number of skill points an entity has. on a Kami, this would be the number
// of skill points the kami has to spend on its skills. on a Skill, this would
// be the number of point allocated to the skill
contract SkillPointComponent is Uint256BareComponent {
  constructor(address world) Uint256BareComponent(world, ID) {}
}
