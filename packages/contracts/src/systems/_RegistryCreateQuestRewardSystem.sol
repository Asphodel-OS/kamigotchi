// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibQuestRegistry } from "libraries/LibQuestRegistry.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Quest.Create.Reward"));

// creates the Reward for an existing Quest (e.g. item, coin, experience)
contract _RegistryCreateQuestRewardSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint32 questIndex, string memory type_, uint32 index, uint256 value) = abi.decode(
      arguments,
      (uint32, string, uint32, uint256)
    );

    // check that the quest exists
    uint256 questID = LibQuestRegistry.getByQuestIndex(components, questIndex);
    require(questID != 0, "Quest does not exist");
    require(!LibString.eq(type_, ""), "Quest Reward type cannot be empty");

    // create an empty Quest Reward and set any non-zero fields
    uint256 id = LibQuestRegistry.createEmptyReward(world, components, questIndex, type_);
    if (index != 0) LibQuestRegistry.setIndex(components, id, index);
    if (value != 0) LibQuestRegistry.setBalance(components, id, value);

    return abi.encode(id);
  }

  function executeTyped(
    uint32 questIndex,
    string memory type_,
    uint32 index, // can be empty
    uint256 value // can be empty
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(questIndex, type_, index, value));
  }
}
