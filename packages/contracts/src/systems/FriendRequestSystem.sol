// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibString } from "solady/utils/LibString.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibFriend } from "libraries/LibFriend.sol";

uint256 constant ID = uint256(keccak256("system.Friend.Request"));

contract FriendRequestSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    address targetAddr = abi.decode(arguments, (address));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);
    uint256 targetID = LibAccount.getByOwner(components, targetAddr);

    require(targetID != 0, "FriendRequest: target no account");
    require(accID != targetID, "FriendRequest: cannot fren self");

    // friendship specific checks
    require(
      LibFriend.getRequestCount(components, targetID) <
        LibConfig.get(components, "FRIENDS_REQUEST_LIMIT"),
      "Max friend requests reached"
    );
    /// @dev FE should not get here; if either alr requested, friends, or blocked, a friendship will exist
    require(
      LibFriend.getFriendship(components, accID, targetID) == 0,
      "FriendRequest: already exists"
    );

    uint256 incomingReq = LibFriend.getFriendship(components, targetID, accID);
    if (incomingReq != 0) {
      string memory state = LibFriend.getState(components, incomingReq);
      if (LibString.eq(state, "REQUEST")) require(false, "FriendRequest: inbound request exists");
      if (LibString.eq(state, "FRIENDS")) require(false, "FriendRequest: already friends");
      if (LibString.eq(state, "BLOCKED")) require(false, "FriendRequest: blocked");
      revert("FriendRequest: complicated situationship(?)");
    }

    // create request
    uint256 requestID = LibFriend.create(components, accID, targetID, "REQUEST");

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    return abi.encode(requestID);
  }

  function executeTyped(address targetAddr) public returns (bytes memory) {
    return execute(abi.encode(targetAddr));
  }
}
