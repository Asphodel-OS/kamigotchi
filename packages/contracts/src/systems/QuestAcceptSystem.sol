// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibQuests } from "libraries/LibQuests.sol";
import { LibRegistryQuests } from "libraries/LibRegistryQuests.sol";

uint256 constant ID = uint256(keccak256("system.Quest.Accept"));

contract QuestAcceptSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 questIndex = abi.decode(arguments, (uint256));
    uint256 questID = LibRegistryQuests.getByQuestIndex(components, questIndex);
    require(questID != 0, "Quest not found");

    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    require(accountID != 0, "QuestAccept: no account");

    require(
      LibQuests.checkRequirements(components, questID, accountID),
      "QuestAccept: reqs not met"
    );

    uint256 assignedID = LibQuests.assignQuest(world, components, questIndex, accountID);
    return abi.encode(assignedID);
  }

  function executeTyped(uint256 index) public returns (bytes memory) {
    return execute(abi.encode(index));
  }
}
