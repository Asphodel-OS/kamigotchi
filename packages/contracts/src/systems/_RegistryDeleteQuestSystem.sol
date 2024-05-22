// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibQuestRegistry } from "libraries/LibQuestRegistry.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Quest.Delete"));

contract _RegistryDeleteQuestSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    uint32 index = abi.decode(arguments, (uint32));
    uint256 registryQuestID = LibQuestRegistry.getByQuestIndex(components, index);
    require(registryQuestID != 0, "Quest does not exist");

    // delete its conditions
    uint256[] memory requirements = LibQuestRegistry.getRequirementsByQuestIndex(components, index);
    for (uint256 i = 0; i < requirements.length; i++) {
      LibQuestRegistry.deleteRequirement(components, requirements[i]);
    }

    // delete its objectives
    uint256[] memory objectives = LibQuestRegistry.getObjectivesByQuestIndex(components, index);
    for (uint256 i = 0; i < objectives.length; i++) {
      LibQuestRegistry.deleteObjective(components, objectives[i]);
    }

    // delete its rewards
    uint256[] memory rewards = LibQuestRegistry.getRewardsByQuestIndex(components, index);
    for (uint256 i = 0; i < rewards.length; i++) {
      LibQuestRegistry.deleteReward(components, rewards[i]);
    }

    // delete it
    LibQuestRegistry.deleteQuest(components, registryQuestID, index);

    return "";
  }

  function executeTyped(uint32 index) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index));
  }
}
