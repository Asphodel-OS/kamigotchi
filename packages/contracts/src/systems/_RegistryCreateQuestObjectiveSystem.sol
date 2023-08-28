// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRegistryQuests } from "libraries/LibRegistryQuests.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Quest.Create.Objective"));

// creates an Objective for an existing Quest (e.g. coin, item)
// the LogicType (verb) will depend on the Type (type of object)
contract _RegistryCreateQuestObjectiveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint256 questIndex,
      string memory name,
      string memory logicType,
      string memory type_,
      uint256 index, // generic index
      uint256 value
    ) = abi.decode(arguments, (uint256, string, string, string, uint256, uint256));

    // check that the quest exists
    uint256 questID = LibRegistryQuests.getByQuestIndex(components, questIndex);
    require(questID != 0, "Quest does not exist");
    require(!LibString.eq(type_, ""), "Quest Objective type cannot be empty");

    // create an empty Quest Objective and set any non-zero fields
    uint256 id = LibRegistryQuests.createEmptyObjective(
      world,
      components,
      questIndex,
      name,
      type_,
      logicType
    );
    if (index != 0) LibRegistryQuests.setIndex(components, id, index);
    if (value != 0) LibRegistryQuests.setValue(components, id, value);

    return "";
  }

  function executeTyped(
    uint256 questIndex,
    string memory name,
    string memory logicType,
    string memory type_,
    uint256 index, // can be empty
    uint256 value
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(questIndex, name, logicType, type_, index, value));
  }
}
