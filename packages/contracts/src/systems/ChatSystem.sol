// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { System } from "solecs/System.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibEmitter } from "libraries/utils/LibEmitter.sol";
import { LibData } from "libraries/LibData.sol";

uint256 constant ID = uint256(keccak256("system.chat"));

contract ChatSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    string memory message = abi.decode(arguments, (string));

    // get sender account and room where the message was originated from
    uint256 accID = LibAccount.getByOperator(components, msg.sender);
    uint32 roomIndex = LibAccount.getRoom(components, accID);

    LibAccount.updateLastTs(components, accID);
    LibData.inc(components, accID, 0, "MESSAGES", 1);

    LibEmitter.emitMessage(world, roomIndex, accID, message);
    return "";
  }

  function executeTyped(string memory message) public returns (bytes memory) {
    return execute(abi.encode(message));
  }
}
