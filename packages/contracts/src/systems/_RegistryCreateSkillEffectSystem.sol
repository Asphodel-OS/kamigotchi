// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibSkillRegistry } from "libraries/LibSkillRegistry.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Skill.Create.Effect"));

contract _RegistryCreateSkillEffectSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint32 skillIndex, string memory type_, string memory subtype, int256 value) = abi.decode(
      arguments,
      (uint32, string, string, int256)
    );

    require(!LibString.eq(type_, ""), "Skill type cannot be empty");

    // create an empty Skill and set any non-zero fields
    uint256 id = LibSkillRegistry.createEffect(world, components, skillIndex, type_, value);
    if (!LibString.eq(subtype, "")) LibSkillRegistry.setSubtype(components, id, subtype);

    return abi.encode(id);
  }

  function executeTyped(
    uint32 skillIndex,
    string memory type_,
    string memory subtype, // optional
    int256 value
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(skillIndex, type_, subtype, value));
  }
}
