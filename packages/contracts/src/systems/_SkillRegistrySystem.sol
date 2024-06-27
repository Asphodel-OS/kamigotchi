// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibSkillRegistry } from "libraries/LibSkillRegistry.sol";

uint256 constant ID = uint256(keccak256("system.skill.registry"));

contract _SkillRegistrySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function create(bytes memory arguments) public onlyOwner returns (uint256) {
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

    uint256 regID = LibSkillRegistry.getByIndex(components, index);
    require(regID == 0, "SkillCreate: already exists");

    regID = LibSkillRegistry.create(
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
    if (!LibString.eq(tree, "")) LibSkillRegistry.setTree(components, regID, tree, treeTier);

    return regID;
  }

  function addEffect(bytes memory arguments) public onlyOwner returns (uint256) {
    (uint32 skillIndex, string memory type_, string memory subtype, int256 value) = abi.decode(
      arguments,
      (uint32, string, string, int256)
    );

    require(!LibString.eq(type_, ""), "Skill type cannot be empty");

    // create an empty Skill and set any non-zero fields
    uint256 id = LibSkillRegistry.createEffect(world, components, skillIndex, type_, value);
    if (!LibString.eq(subtype, "")) LibSkillRegistry.setSubtype(components, id, subtype);

    return id;
  }

  function addRequirement(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 skillIndex,
      string memory type_,
      string memory logicType,
      uint32 index,
      uint256 value
    ) = abi.decode(arguments, (uint32, string, string, uint32, uint256));

    require(!LibString.eq(type_, ""), "Skill type cannot be empty");

    // create an empty Skill and set any non-zero fields
    uint256 id = LibSkillRegistry.createRequirement(
      world,
      components,
      skillIndex,
      type_,
      logicType
    );
    if (index != 0) LibSkillRegistry.setIndex(components, id, index);
    if (value != 0) LibSkillRegistry.setBalance(components, id, value);

    return id;
  }

  function remove(uint32 index) public onlyOwner {
    uint256 desID = LibSkillRegistry.getByIndex(components, index);
    require(desID != 0, "Skill does not exist");
    LibSkillRegistry.delete_(components, desID);

    uint256[] memory skills = LibSkillRegistry.getEffectsByIndex(components, index);
    for (uint256 i = 0; i < skills.length; i++) {
      LibSkillRegistry.deleteEffect(components, skills[i]);
    }

    uint256[] memory requirements = LibSkillRegistry.getRequirementsByIndex(components, index);
    for (uint256 i = 0; i < requirements.length; i++) {
      LibSkillRegistry.deleteRequirement(components, requirements[i]);
    }
  }

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    require(false, "not implemented");
  }
}
