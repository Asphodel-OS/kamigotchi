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
    uint256 regID = LibRegistryQuests.getByQuestIndex(components, questIndex);
    require(regID != 0, "Quest not found");

    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    require(accountID != 0, "QuestAccept: no account");

    require(
      LibQuests.checkRequirements(components, regID, questIndex, accountID),
      "QuestAccept: reqs not met"
    );

    uint256 assignedID;
    if (LibQuests.isRepeatable(components, regID)) {
      // repeatable quests - accepted before check is implicit
      uint256[] memory questIDs = LibQuests.queryAccountQuestIndex(
        components,
        accountID,
        questIndex
      );
      // repeatable quests can only have 0 or 1 instances
      // if no instance, leave assignedID as 0
      if (questIDs.length == 1) {
        assignedID = questIDs[0];
      }
      require(
        LibQuests.checkRepeat(components, questIndex, assignedID),
        "QuestAccept: repeat cons not met"
      );
      assignedID = LibQuests.assignRepeatable(world, components, questIndex, assignedID, accountID);
    } else {
      // not repeatable - check that quest has not been accepted before
      require(
        LibQuests.checkMax(components, regID, questIndex, accountID),
        "QuestAccept: accepted before"
      );
      assignedID = LibQuests.assign(world, components, questIndex, accountID);
    }

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);
    return abi.encode(assignedID);
  }

  function executeTyped(uint256 index) public returns (bytes memory) {
    return execute(abi.encode(index));
  }
}
