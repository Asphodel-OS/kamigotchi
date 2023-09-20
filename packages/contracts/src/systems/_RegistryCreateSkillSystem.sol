// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibRegistrySkill } from "libraries/LibRegistrySkill.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Skill.Create.Skill"));

contract _RegistryCreateSkillSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint256 skillIndex, string memory type_) = abi.decode(arguments, (uint256, string));

    require(!LibString.eq(type_, ""), "Skill type cannot be empty");

    // create an empty Skill and set any non-zero fields
    uint256 id = LibRegistrySkill.createSkill(world, components, skillIndex, type_);

    return "";
  }

  function executeTyped(
    uint256 skillIndex,
    string memory type_
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(skillIndex, type_));
  }
}
