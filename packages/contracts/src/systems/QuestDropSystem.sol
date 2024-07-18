// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibQuests } from "libraries/LibQuests.sol";

uint256 constant ID = uint256(keccak256("system.Quest.Drop"));

contract QuestDropSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 questID = abi.decode(arguments, (uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    require(LibQuests.isQuest(components, questID), "Quest: not a quest");
    require(!LibQuests.isCompleted(components, questID), "Quests: alr completed");
    require(accID == LibQuests.getOwner(components, questID), "Quest: not ur quest");

    LibQuests.drop(components, questID);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
