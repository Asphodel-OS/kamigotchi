// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibRegistrySkill } from "libraries/LibRegistrySkill.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Skill.Create.Description"));

contract _RegistryCreateSkillDescriptionSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint256 skillIndex, string memory name, string memory description) = abi.decode(
      arguments,
      (uint256, string, string)
    );

    uint256 regID = LibRegistrySkill.getDescriptionByIndex(components, skillIndex);
    require(regID == 0, "Skill description already exists");

    // create an empty Skill and set any non-zero fields
    uint256 id = LibRegistrySkill.createSkillDescription(
      world,
      components,
      skillIndex,
      name,
      description
    );

    return abi.encode(id);
  }

  function executeTyped(
    uint256 skillIndex,
    string memory name,
    string memory description
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(skillIndex, name, description));
  }
}
