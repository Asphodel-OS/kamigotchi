// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibRegistryQuests } from "libraries/LibRegistryQuests.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Quest.Create.Requirement"));

// creates a Requirement for an existing Quest. assumes that all Requirements are
// based on a current value or state of completion (e.g. level, quest)
contract _RegistryCreateQuestRequirementSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint32 questIndex,
      string memory logicType,
      string memory type_,
      uint32 index,
      uint256 value
    ) = abi.decode(arguments, (uint32, string, string, uint32, uint256));

    // check that the quest exists
    uint256 questID = LibRegistryQuests.getByQuestIndex(components, questIndex);
    require(questID != 0, "Quest does not exist");
    require(!LibString.eq(type_, ""), "Quest Requirement type cannot be empty");

    // create an empty Quest Requirement and set any non-zero fields
    uint256 id = LibRegistryQuests.createEmptyRequirement(
      world,
      components,
      questIndex,
      logicType,
      type_
    );
    if (index != 0) LibRegistryQuests.setIndex(components, id, index);
    if (value != 0) LibRegistryQuests.setBalance(components, id, value);

    return abi.encode(id);
  }

  function executeTyped(
    uint32 questIndex,
    string memory logicType,
    string memory type_,
    uint32 index,
    uint256 value
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(questIndex, logicType, type_, index, value));
  }
}
