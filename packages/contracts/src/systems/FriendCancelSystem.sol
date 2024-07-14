// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { PlayerSystem } from "systems/base/PlayerSystem.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibString } from "solady/utils/LibString.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibFriend } from "libraries/LibFriend.sol";

uint256 constant ID = uint256(keccak256("system.Friend.Cancel"));

/// @notice a generic system to cancel friendships in any state (cancel friend req, unfriend, unblock)
contract FriendCancelSystem is PlayerSystem {
  constructor(IWorld _world, address _components) PlayerSystem(_world, _components) {}

  function execute(bytes memory arguments) public notPaused returns (bytes memory) {
    uint256 friendshipID = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    require(LibFriend.isFriendship(components, friendshipID), "FriendCancel: not a friendship");

    string memory state = LibFriend.getState(components, friendshipID);
    if (LibString.eq(state, "REQUEST")) {
      // request can be deleted by either party
      require(
        LibFriend.getAccount(components, friendshipID) == accountID ||
          LibFriend.getTarget(components, friendshipID) == accountID,
        "FriendCancel: not owner/target"
      );
    } else if (LibString.eq(state, "BLOCKED")) {
      // block can only be deleted by owner
      require(
        LibFriend.getAccount(components, friendshipID) == accountID,
        "FriendCancel: not owner"
      );
    } else {
      // if friend, delete friendship owned by other entity
      require(
        LibFriend.getAccount(components, friendshipID) == accountID,
        "FriendCancel: not owner"
      );

      uint256 counterpartyID = LibFriend.getFriendship(
        components,
        LibFriend.getTarget(components, friendshipID),
        accountID
      );
      LibFriend.remove(components, counterpartyID);
    }

    LibFriend.remove(components, friendshipID);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(uint256 id) public notPaused returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
