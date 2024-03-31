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
    uint32 index = abi.decode(arguments, (uint32));
    uint256 regID = LibRegistryQuests.getByQuestIndex(components, index);
    require(regID != 0, "Quest not found");

    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    require(
      LibQuests.checkRequirements(components, regID, index, accountID),
      "QuestAccept: reqs not met"
    );

    uint256 questID = LibQuests.queryAccountQuestIndex(components, accountID, index);
    if (LibQuests.isRepeatable(components, regID)) {
      // repeatable quests - accepted before check is implicit
      // repeatable quests can only have 0 or 1 instances
      require(
        LibQuests.checkRepeat(components, index, questID),
        "QuestAccept: repeat cons not met"
      );
      questID = LibQuests.assignRepeatable(world, components, index, questID, accountID);
    } else {
      // not repeatable - check that quest has not been accepted before
      require(questID == 0, "QuestAccept: accepted before");
      questID = LibQuests.assign(world, components, index, accountID);
    }

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);
    return abi.encode(questID);
  }

  function executeTyped(uint32 index) public returns (bytes memory) {
    return execute(abi.encode(index));
  }
}
