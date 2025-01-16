// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { Condition } from "libraries/LibConditional.sol";
import { LibSkillRegistry } from "libraries/LibSkillRegistry.sol";

uint256 constant ID = uint256(keccak256("system.skill.registry"));

contract _SkillRegistrySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function create(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 index,
      string memory for_,
      string memory tree,
      string memory name,
      string memory description,
      uint256 cost,
      uint256 max,
      uint256 treeTier,
      string memory media
    ) = abi.decode(
        arguments,
        (uint32, string, string, string, string, uint256, uint256, uint256, string)
      );

    require(index != 0, "SkillCreate: index cannot be 0");
    require(!LibString.eq(name, ""), "SkillCreate: name empty");

    uint256 regID = LibSkillRegistry.getByIndex(components, index);
    require(regID == 0, "SkillCreate: already exists");

    regID = LibSkillRegistry.create(
      components,
      index,
      for_,
      name,
      description,
      cost,
      max,
      tree,
      treeTier,
      media
    );

    return regID;
  }

  function addBonus(bytes memory arguments) public onlyOwner returns (uint256) {
    (uint32 skillIndex, string memory type_, int256 value) = abi.decode(
      arguments,
      (uint32, string, int256)
    );

    require(LibSkillRegistry.getByIndex(components, skillIndex) != 0, "Skill does not exist");

    uint256 id = LibSkillRegistry.addBonus(components, skillIndex, type_, value);
    return id;
  }

  function addRequirement(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 skillIndex,
      string memory type_,
      string memory logicType,
      uint32 index,
      uint256 value,
      string memory condFor
    ) = abi.decode(arguments, (uint32, string, string, uint32, uint256, string));

    require(LibSkillRegistry.getByIndex(components, skillIndex) != 0, "Skill does not exist");

    return
      LibSkillRegistry.addRequirement(
        world,
        components,
        skillIndex,
        Condition(type_, logicType, index, value, condFor)
      );
  }

  function remove(uint32 index) public onlyOwner {
    uint256 regID = LibSkillRegistry.getByIndex(components, index);
    require(regID != 0, "Skill does not exist");
    LibSkillRegistry.remove(components, index);
  }

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    require(false, "not implemented");
  }
}
