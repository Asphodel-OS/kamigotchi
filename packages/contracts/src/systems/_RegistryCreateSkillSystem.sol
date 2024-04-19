// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibRegistrySkill } from "libraries/LibRegistrySkill.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Skill.Create"));

contract _RegistryCreateSkillSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint32 index,
      string memory for_,
      string memory type_,
      string memory tree,
      string memory name,
      string memory description,
      uint256 cost,
      uint256 max,
      uint256 treeTier,
      string memory media
    ) = abi.decode(
        arguments,
        (uint32, string, string, string, string, string, uint256, uint256, uint256, string)
      );

    require(index != 0, "SkillCreate: index cannot be 0");
    require(!LibString.eq(type_, ""), "SkillCreate: type empty");
    require(!LibString.eq(name, ""), "SkillCreate: name empty");

    uint256 regID = LibRegistrySkill.getByIndex(components, index);
    require(regID == 0, "SkillCreate: already exists");

    regID = LibRegistrySkill.create(
      components,
      index,
      for_,
      type_,
      name,
      description,
      cost,
      max,
      media
    );
    if (!LibString.eq(tree, "")) LibRegistrySkill.setTree(components, regID, tree, treeTier);

    return abi.encode(regID);
  }

  function executeTyped(
    uint32 index,
    string memory for_,
    string memory type_,
    string memory tree,
    string memory name,
    string memory description,
    uint256 cost,
    uint256 max,
    uint256 treeTier,
    string memory media
  ) public onlyOwner returns (bytes memory) {
    return
      execute(abi.encode(index, for_, type_, tree, name, description, cost, max, treeTier, media));
  }
}
