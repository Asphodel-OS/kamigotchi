// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibRegistrySkill } from "libraries/LibRegistrySkill.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Skill.Delete"));

contract _RegistryDeleteSkillSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    uint256 index = abi.decode(arguments, (uint256));

    uint256 desID = LibRegistrySkill.getDescriptionByIndex(components, index);
    require(desID != 0, "Skill does not exist");
    LibRegistrySkill.deleteSkillDescription(components, desID);

    uint256[] memory skills = LibRegistrySkill.getSkillsByIndex(components, index);
    for (uint256 i = 0; i < skills.length; i++) {
      LibRegistrySkill.deleteSkill(components, skills[i]);
    }

    uint256[] memory requirements = LibRegistrySkill.getRequirementsByIndex(components, index);
    for (uint256 i = 0; i < requirements.length; i++) {
      LibRegistrySkill.deleteRequirement(components, requirements[i]);
    }

    return "";
  }

  function executeTyped(uint256 skillIndex) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(skillIndex));
  }
}
