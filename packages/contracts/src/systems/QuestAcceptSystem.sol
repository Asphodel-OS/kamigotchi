// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibAssigner } from "libraries/LibAssigner.sol";
import { LibQuests } from "libraries/LibQuests.sol";
import { LibQuestRegistry } from "libraries/LibQuestRegistry.sol";

uint256 constant ID = uint256(keccak256("system.quest.accept"));

contract QuestAcceptSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 assignerID, uint32 index) = abi.decode(arguments, (uint256, uint32));
    uint256 regID = LibQuestRegistry.getByIndex(components, index);
    if (regID == 0) revert("Quest not found");

    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // check requirements
    LibAssigner.checkFor(components, assignerID, regID, accID);
    LibQuests.verifyRequirements(components, index, accID);

    uint256 questID = LibQuests.getAccQuestIndex(components, accID, index);
    if (LibQuests.isRepeatable(components, regID)) {
      // repeatable quests - accepted before check is implicit
      // repeatable quests can only have 0 or 1 instances
      LibQuests.verifyRepeatable(components, index, questID);
      questID = LibQuests.assignRepeatable(world, components, index, questID, accID);
    } else {
      // not repeatable - check that quest has not been accepted before
      if (questID != 0) revert("accepted before");
      questID = LibQuests.assign(world, components, index, accID);
    }

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    return abi.encode(questID);
  }

  function executeTyped(uint256 assignerID, uint32 index) public returns (bytes memory) {
    return execute(abi.encode(assignerID, index));
  }
}
