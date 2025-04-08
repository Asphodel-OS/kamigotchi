// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibQuest } from "libraries/LibQuest.sol";
import { LibQuestRegistry } from "libraries/LibQuestRegistry.sol";

uint256 constant ID = uint256(keccak256("system.quest.accept"));

contract QuestAcceptSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint32 index = abi.decode(arguments, (uint32));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // check requirements
    LibQuestRegistry.verifyExists(components, index);
    LibQuest.verifyEnabled(components, index);
    LibQuest.verifyRequirements(components, index, accID);

    uint256 questID = LibQuest.getAccQuestIndex(components, accID, index);
    if (LibQuestRegistry.isRepeatable(components, index)) {
      // repeatable quests - accepted before check is implicit
      // repeatable quests can only have 0 or 1 instances
      LibQuest.verifyRepeatable(components, index, questID);
      questID = LibQuest.assignRepeatable(components, index, questID, accID);
    } else {
      // not repeatable - check that quest has not been accepted before
      if (questID != 0) revert("accepted before");
      questID = LibQuest.assign(components, index, accID);
    }

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    return abi.encode(questID);
  }

  function executeTyped(uint32 index) public returns (bytes memory) {
    return execute(abi.encode(index));
  }
}
