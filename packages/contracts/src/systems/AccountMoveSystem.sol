// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { PlayerSystem } from "systems/base/PlayerSystem.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { Coord, LibRoom } from "libraries/LibRoom.sol";

uint256 constant ID = uint256(keccak256("system.Account.Move"));

// moves the account to a valid room location
contract AccountMoveSystem is PlayerSystem {
  constructor(IWorld _world, address _components) PlayerSystem(_world, _components) {}

  function execute(bytes memory arguments) public notPaused returns (bytes memory) {
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    require(LibAccount.syncStamina(components, accountID) > 0, "AccMove: out of stamina");

    uint32 toIndex = abi.decode(arguments, (uint32));
    uint32 currIndex = LibAccount.getRoom(components, accountID);
    uint256 currRoomID = LibRoom.queryByIndex(components, currIndex);
    uint256 toRoomID = LibRoom.queryByIndex(components, toIndex);

    require(
      LibRoom.isReachable(components, toIndex, currRoomID, toRoomID),
      "AccMove: unreachable room"
    );
    require(
      LibRoom.isAccessible(components, currIndex, toIndex, accountID),
      "AccMove: inaccessible room"
    );

    LibAccount.move(components, accountID, toIndex);

    // standard logging and tracking
    LibRoom.logMove(components, accountID);
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(uint32 toIndex) public notPaused returns (bytes memory) {
    return execute(abi.encode(toIndex));
  }
}
