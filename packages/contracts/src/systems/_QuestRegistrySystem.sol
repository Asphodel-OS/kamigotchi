// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";

import { Condition, LibQuestRegistry } from "libraries/LibQuestRegistry.sol";

uint256 constant ID = uint256(keccak256("system.quest.registry"));

contract _QuestRegistrySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function create(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 index,
      string memory name,
      string memory description,
      string memory endText,
      uint256 duration
    ) = abi.decode(arguments, (uint32, string, string, string, uint256));

    uint256 regID = LibQuestRegistry.createQuest(components, index, name, description, endText);

    // set repeatable (if so)
    if (duration > 0) LibQuestRegistry.setRepeatable(components, regID, duration);

    return regID;
  }

  function addObjective(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 questIndex,
      string memory name,
      string memory logicType,
      string memory type_,
      uint32 index, // generic index
      uint256 value
    ) = abi.decode(arguments, (uint32, string, string, string, uint32, uint256));

    uint256 questID = LibQuestRegistry.getByIndex(components, questIndex);
    require(questID != 0, "Quest does not exist");
    require(!LibString.eq(type_, ""), "Quest Objective type cannot be empty");

    return
      LibQuestRegistry.createObjective(
        world,
        components,
        questIndex,
        name,
        Condition(type_, logicType, index, value)
      );
  }

  function addRequirement(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 questIndex,
      string memory logicType,
      string memory type_,
      uint32 index,
      uint256 value
    ) = abi.decode(arguments, (uint32, string, string, uint32, uint256));

    uint256 questID = LibQuestRegistry.getByIndex(components, questIndex);
    require(questID != 0, "Quest does not exist");
    require(!LibString.eq(type_, ""), "Quest Requirement type cannot be empty");

    return
      LibQuestRegistry.addRequirement(
        world,
        components,
        questIndex,
        Condition(type_, logicType, index, value)
      );
  }

  function addReward(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 questIndex,
      string memory type_,
      uint32 index,
      uint32[] memory keys,
      uint256[] memory weights,
      uint256 value
    ) = abi.decode(arguments, (uint32, string, uint32, uint32[], uint256[], uint256));

    // check that the quest exists
    uint256 questID = LibQuestRegistry.getByIndex(components, questIndex);
    require(questID != 0, "Quest does not exist");
    require(!LibString.eq(type_, ""), "Quest Reward type cannot be empty");

    // create an empty Quest Reward and set any non-zero fields
    uint256 id = LibQuestRegistry.createReward(
      world,
      components,
      questIndex,
      type_,
      index,
      keys,
      weights,
      value
    );

    return id;
  }

  function remove(uint32 index) public onlyOwner {
    uint256 registryQuestID = LibQuestRegistry.getByIndex(components, index);
    require(registryQuestID != 0, "Quest does not exist");

    LibQuestRegistry.removeQuest(components, registryQuestID, index);
  }

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    require(false, "not implemented");
  }
}
