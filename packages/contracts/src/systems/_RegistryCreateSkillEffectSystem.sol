// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibRegistrySkill } from "libraries/LibRegistrySkill.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Skill.Create.Effect"));

contract _RegistryCreateSkillEffectSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint32 skillIndex,
      string memory type_,
      string memory subtype,
      string memory logicType,
      uint32 index,
      uint256 value
    ) = abi.decode(arguments, (uint32, string, string, string, uint32, uint256));

    require(!LibString.eq(type_, ""), "Skill type cannot be empty");

    // create an empty Skill and set any non-zero fields
    uint256 id = LibRegistrySkill.createEffect(world, components, skillIndex, type_);
    if (!LibString.eq(subtype, "")) LibRegistrySkill.setSubtype(components, id, subtype);
    if (!LibString.eq(logicType, "")) LibRegistrySkill.setLogicType(components, id, logicType);
    if (index != 0) LibRegistrySkill.setIndex(components, id, index);
    if (value != 0) LibRegistrySkill.setBalance(components, id, value);

    return "";
  }

  function executeTyped(
    uint32 skillIndex,
    string memory type_,
    string memory subtype, // optional
    string memory logicType, // optional
    uint32 index, // optional
    uint256 value // optional
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(skillIndex, type_, subtype, logicType, index, value));
  }
}
