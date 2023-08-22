// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibRegistryQuests } from "libraries/LibRegistryQuests.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Quest.Requirement.Create"));

// creates a Requirement for an existing Quest. assumes that all Requirements are
// based on a current value or state of completion (e.g. level, quest)
contract _RegistryCreateQuestRequirementSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint256 questIndex, string memory type_, uint256 index, uint256 value) = abi.decode(
      arguments,
      (uint256, string, uint256, uint256)
    );

    uint256 id = LibRegistryQuests.createEmptyRequirement(world, components, questIndex);

    LibRegistryQuests.setType(components, id, type_);
    if (LibString.eq(type_, "QUEST")) {
      LibRegistryQuests.setIndex(components, id, index);
    } else if (LibString.eq(type_, "LEVEL")) {
      LibRegistryQuests.setValue(components, id, value);
    } else {
      require(false, "unsupported quest requirement type");
    }

    return "";
  }

  function executeTyped(
    uint256 questIndex,
    string memory type_,
    uint256 index,
    uint256 value
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(questIndex, type_, index, value));
  }
}
