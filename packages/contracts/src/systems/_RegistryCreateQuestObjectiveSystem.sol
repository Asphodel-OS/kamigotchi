// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibQuestRegistry } from "libraries/LibQuestRegistry.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Quest.Create.Objective"));

// creates an Objective for an existing Quest (e.g. coin, item)
// this can be based on either accrual (from quest start) or current state
contract _RegistryCreateQuestObjectiveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint32 questIndex,
      string memory name,
      string memory logicType,
      string memory type_,
      uint32 index, // generic index
      uint256 value
    ) = abi.decode(arguments, (uint32, string, string, string, uint32, uint256));

    // check that the quest exists
    uint256 questID = LibQuestRegistry.getByQuestIndex(components, questIndex);
    require(questID != 0, "Quest does not exist");
    require(!LibString.eq(type_, ""), "Quest Objective type cannot be empty");

    // create an empty Quest Objective and set any non-zero fields
    uint256 id = LibQuestRegistry.createEmptyObjective(
      world,
      components,
      questIndex,
      name,
      logicType,
      type_,
      index
    );

    if (value != 0) LibQuestRegistry.setBalance(components, id, value);

    return abi.encode(id);
  }

  function executeTyped(
    uint32 questIndex,
    string memory name,
    string memory logicType,
    string memory type_,
    uint32 index, // can be empty
    uint256 value
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(questIndex, name, logicType, type_, index, value));
  }
}
