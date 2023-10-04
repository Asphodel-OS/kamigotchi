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
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    require(accountID != 0, "QuestDrop: no account");
    require(LibQuests.isQuest(components, questID), "QuestDrop: not a quest");
    require(accountID == LibQuests.getAccountId(components, questID), "QuestDrop: not ur quest");

    LibQuests.drop(components, questID);

    LibAccount.updateLastBlock(components, accountID);

    return "";
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
