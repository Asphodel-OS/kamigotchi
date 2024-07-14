// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { PlayerSystem } from "systems/base/PlayerSystem.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibQuests } from "libraries/LibQuests.sol";

uint256 constant ID = uint256(keccak256("system.Quest.Drop"));

contract QuestDropSystem is PlayerSystem {
  constructor(IWorld _world, address _components) PlayerSystem(_world, _components) {}

  function execute(bytes memory arguments) public notPaused returns (bytes memory) {
    uint256 questID = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    require(LibQuests.isQuest(components, questID), "Quest: not a quest");
    require(!LibQuests.isCompleted(components, questID), "Quests: alr completed");
    require(accountID == LibQuests.getOwner(components, questID), "Quest: not ur quest");

    LibQuests.drop(components, questID);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(uint256 id) public notPaused returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
