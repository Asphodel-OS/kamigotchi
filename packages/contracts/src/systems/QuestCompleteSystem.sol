// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { PlayerSystem } from "systems/base/PlayerSystem.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibQuests } from "libraries/LibQuests.sol";

uint256 constant ID = uint256(keccak256("system.Quest.Complete"));

contract QuestCompleteSystem is PlayerSystem {
  constructor(IWorld _world, address _components) PlayerSystem(_world, _components) {}

  function execute(bytes memory arguments) public notPaused returns (bytes memory) {
    uint256 questID = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    require(accountID == LibQuests.getOwner(components, questID), "Quest: not account");
    require(!LibQuests.isCompleted(components, questID), "Quests: alr completed");
    require(LibQuests.isQuest(components, questID), "Quest: not a quest");
    require(LibQuests.checkObjectives(components, questID, accountID), "Quest: objs not met");

    LibQuests.complete(world, components, questID, accountID);

    // standard logging and tracking
    LibQuests.logComplete(components, accountID);
    LibQuests.logCompleteRepeatable(components, accountID, questID);
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(uint256 id) public notPaused returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
