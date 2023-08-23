// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibRegistryQuests } from "libraries/LibRegistryQuests.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Quest.Create.Reward"));

// creates the Reward for an existing Quest (e.g. item, coin, experience)
contract _RegistryCreateQuestRewardSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint256 questIndex, string memory type_, uint256 index, uint256 value) = abi.decode(
      arguments,
      (uint256, string, uint256, uint256)
    );

    // check that the quest exists
    uint256 questID = LibRegistryQuests.getByQuestIndex(components, questIndex);
    require(questID != 0, "Quest does not exist");
    require(!LibString.eq(type_, ""), "Quest Reward type cannot be empty");

    // create an empty Quest Reward and set any non-zero fields
    uint256 id = LibRegistryQuests.createEmptyReward(world, components, questIndex, type_);
    if (index != 0) LibRegistryQuests.setIndex(components, id, index);
    if (value != 0) LibRegistryQuests.setValue(components, id, value);

    return "";
  }

  function executeTyped(
    uint256 questIndex,
    string memory type_,
    uint256 index, // can be empty
    uint256 value // can be empty
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(questIndex, type_, index, value));
  }
}
