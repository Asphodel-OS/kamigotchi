// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibString } from "solady/utils/LibString.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibFriend } from "libraries/LibFriend.sol";

uint256 constant ID = uint256(keccak256("system.friend.cancel"));

/// @notice a generic system to cancel friendships in any state (cancel friend req, unfriend, unblock)
contract FriendCancelSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 friendshipID = abi.decode(arguments, (uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    require(LibFriend.isFriendship(components, friendshipID), "FriendCancel: not a friendship");

    string memory state = LibFriend.getState(components, friendshipID);
    if (LibString.eq(state, "REQUEST")) {
      // request can be deleted by either party
      require(
        LibFriend.getAccount(components, friendshipID) == accID ||
          LibFriend.getTarget(components, friendshipID) == accID,
        "FriendCancel: not owner/target"
      );
    } else if (LibString.eq(state, "BLOCKED")) {
      // block can only be deleted by owner
      require(LibFriend.getAccount(components, friendshipID) == accID, "FriendCancel: not owner");
    } else {
      // if friend, delete friendship owned by other entity
      require(LibFriend.getAccount(components, friendshipID) == accID, "FriendCancel: not owner");

      uint256 counterpartyID = LibFriend.getFriendship(
        components,
        LibFriend.getTarget(components, friendshipID),
        accID
      );
      LibFriend.remove(components, counterpartyID);
    }

    LibFriend.remove(components, friendshipID);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
