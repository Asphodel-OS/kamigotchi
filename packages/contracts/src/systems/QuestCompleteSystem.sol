// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibData } from "libraries/LibData.sol";
import { LibQuests } from "libraries/LibQuests.sol";

uint256 constant ID = uint256(keccak256("system.quest.complete"));

contract QuestCompleteSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 questID = abi.decode(arguments, (uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    LibQuests.verifyOwner(components, questID, accID);
    LibQuests.verifyNotCompleted(components, questID);
    LibQuests.verifyIsQuest(components, questID);
    LibQuests.verifyObjectives(components, questID, accID);

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
