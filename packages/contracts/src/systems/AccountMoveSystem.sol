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

    Location memory currLoc = LibAccount.getLocation(components, accountID);
    Location memory toLoc = abi.decode(arguments, (Location));
    (uint256 currRoomID, uint256 toRoomID) = LibRoom.queryByLocPair(components, currLoc, toLoc);

    require(LibAccount.syncStamina(components, accountID) != 0, "AccMove: out of stamina");
    require(
      LibRoom.isReachable(components, currRoomID, currLoc, toLoc),
      "AccMove: unreachable location"
    );

    LibAccount.move(components, accountID, toLoc);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(Location memory toLoc) public returns (bytes memory) {
    return execute(abi.encode(toLoc));
  }
}
