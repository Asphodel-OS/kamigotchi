// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { Location, LibRoom } from "libraries/LibRoom.sol";

uint256 constant ID = uint256(keccak256("system.Account.Move"));

// moves the account to a valid room location
contract AccountMoveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    require(accountID != 0, "AccMove: no account");
    require(LibAccount.syncStamina(components, accountID) != 0, "AccMove: out of stamina");

    uint256 toIndex = abi.decode(arguments, (uint256));
    Location memory currLoc = LibAccount.getLocation(components, accountID);
    (uint256 currRoomID, uint256 toRoomID) = LibRoom.queryTupleByLocAndIndex(
      components,
      currLoc,
      toIndex
    );
    Location memory toLoc = LibRoom.getLocation(components, toRoomID);

    require(
      LibRoom.isReachable(components, currRoomID, toIndex, currLoc, toLoc),
      "AccMove: unreachable location"
    );

    LibAccount.move(components, accountID, toLoc);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(uint256 toIndex) public returns (bytes memory) {
    return execute(abi.encode(toIndex));
  }
}
