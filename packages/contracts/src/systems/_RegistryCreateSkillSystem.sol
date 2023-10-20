// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibRegistrySkill } from "libraries/LibRegistrySkill.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Skill.Create"));

contract _RegistryCreateSkillSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint256 index,
      string memory for_,
      string memory type_,
      string memory name,
      uint256 cost,
      uint256 max,
      string memory description
    ) = abi.decode(arguments, (uint256, string, string, string, uint256, uint256, string));

    require(index != 0, "SkillCreate: index cannot be 0");
    require(!LibString.eq(type_, ""), "SkillCreate: type cannot be empty");
    require(!LibString.eq(name, ""), "SkillCreate: name cannot be empty");
    require(!LibString.eq(description, ""), "SkillCreate: description cannot be empty");

    uint256 registryID = LibRegistrySkill.getByIndex(components, index);
    require(registryID == 0, "SkillCreate: already exists");

    LibRegistrySkill.create(world, components, index, for_, type_, name, cost, max, description);

    return "";
  }

  function executeTyped(
    uint256 index,
    string memory for_,
    string memory type_,
    string memory name,
    uint256 cost,
    uint256 max,
    string memory description
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, for_, type_, name, cost, max, description));
  }
}
