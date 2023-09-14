// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRegistryQuests } from "libraries/LibRegistryQuests.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Quest.Delete"));

contract _RegistryDeleteQuestSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    uint256 index = abi.decode(arguments, (uint256));
    uint256 registryQuestID = LibRegistryQuests.getByQuestIndex(components, index);
    require(registryQuestID != 0, "Quest does not exist");

    // delete its conditions
    uint256[] memory requirements = LibRegistryQuests.getRequirementsByQuestIndex(
      components,
      index
    );
    for (uint256 i = 0; i < requirements.length; i++) {
      LibRegistryQuests.deleteRequirement(components, requirements[i]);
    }

    // delete its objectives
    uint256[] memory objectives = LibRegistryQuests.getObjectivesByQuestIndex(components, index);
    for (uint256 i = 0; i < objectives.length; i++) {
      LibRegistryQuests.deleteObjective(components, objectives[i]);
    }

    // delete its rewards
    uint256[] memory rewards = LibRegistryQuests.getRewardsByQuestIndex(components, index);
    for (uint256 i = 0; i < rewards.length; i++) {
      LibRegistryQuests.deleteReward(components, rewards[i]);
    }

    // delete it
    LibRegistryQuests.deleteQuest(components, registryQuestID);

    return "";
  }

  function executeTyped(uint256 index) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index));
  }
}
