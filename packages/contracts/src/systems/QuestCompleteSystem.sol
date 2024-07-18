// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibData } from "libraries/LibData.sol";
import { LibQuests } from "libraries/LibQuests.sol";

uint256 constant ID = uint256(keccak256("system.Quest.Complete"));

contract QuestCompleteSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 questID = abi.decode(arguments, (uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    require(accID == LibQuests.getOwner(components, questID), "Quest: not account");
    require(!LibQuests.isCompleted(components, questID), "Quests: alr completed");
    require(LibQuests.isQuest(components, questID), "Quest: not a quest");
    require(LibQuests.checkObjectives(components, questID, accID), "Quest: objs not met");

    LibQuests.complete(world, components, questID, accID);

    // standard logging and tracking
    LibQuests.logComplete(components, accID);
    LibQuests.logCompleteRepeatable(components, accID, questID);
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
