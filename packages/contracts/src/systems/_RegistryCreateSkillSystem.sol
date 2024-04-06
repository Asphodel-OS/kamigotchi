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
      uint32 index,
      string memory for_,
      string memory type_,
      string memory name,
      uint256 cost,
      uint256 max,
      string memory description,
      string memory media
    ) = abi.decode(arguments, (uint32, string, string, string, uint256, uint256, string, string));

    require(index != 0, "SkillCreate: index cannot be 0");
    require(!LibString.eq(type_, ""), "SkillCreate: type empty");
    require(!LibString.eq(name, ""), "SkillCreate: name empty");
    require(!LibString.eq(description, ""), "SkillCreate: description empty");

    uint256 registryID = LibRegistrySkill.getByIndex(components, index);
    require(registryID == 0, "SkillCreate: already exists");

    LibRegistrySkill.create(components, index, for_, type_, name, cost, max, description, media);

    return "";
  }

  function executeTyped(
    uint32 index,
    string memory for_,
    string memory type_,
    string memory name,
    uint256 cost,
    uint256 max,
    string memory description,
    string memory media
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, for_, type_, name, cost, max, description, media));
  }
}
