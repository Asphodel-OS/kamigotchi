// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { Coord, LibRoom } from "libraries/LibRoom.sol";

uint256 constant ID = uint256(keccak256("system.account.move"));

// moves the account to a valid room location
contract AccountMoveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    uint32 toIndex = abi.decode(arguments, (uint32));
    uint32 currIndex = LibAccount.getRoom(components, accID);
    uint256 currRoomID = LibRoom.getByIndex(components, currIndex);
    uint256 toRoomID = LibRoom.getByIndex(components, toIndex);

    if (!LibRoom.isReachable(components, toIndex, currRoomID, toRoomID)) {
      revert("AccMove: unreachable room");
    }
    if (!LibRoom.isAccessible(components, currIndex, toIndex, accID)) {
      revert("AccMove: inaccessible room");
    }

    LibAccount.sync(components, accID);
    LibAccount.move(components, accID, toIndex); // implicit stamina check

    // standard logging and tracking
    LibRoom.logMove(components, accID);
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(uint32 toIndex) public returns (bytes memory) {
    return execute(abi.encode(toIndex));
  }
}
