// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { System } from "solecs/System.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibEmitter } from "libraries/utils/LibEmitter.sol";
import { LibScore } from "libraries/LibScore.sol";

uint256 constant ID = uint256(keccak256("system.chat"));

contract ChatSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    bytes memory message = abi.decode(arguments, (bytes));

    uint256 accID = LibAccount.getByOperator(components, msg.sender);
    uint32 roomId = LibAccount.getRoom(components, accID);

    LibAccount.updateLastTs(components, accID);
    LibScore.incFor(components, accID, "MESSAGES", 1);

    LibEmitter.emitMessage(world, roomId, accID, message, false);
    return "";
  }

  function executeTyped(string memory message) public returns (bytes memory) {
    return execute(abi.encode(message));
  }
}
