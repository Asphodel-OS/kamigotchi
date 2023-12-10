// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibString } from "solady/utils/LibString.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibFriend } from "libraries/LibFriend.sol";

uint256 constant ID = uint256(keccak256("system.Friend.Request"));

contract FriendRequestSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    address targetAddr = abi.decode(arguments, (address));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    uint256 targetID = LibAccount.getByOwner(components, targetAddr);

    require(accountID != 0, "FriendReq: no account");
    require(targetID != 0, "FriendReq: target no account");
    require(accountID != targetID, "FriendReq: cannot friend self");

    // friendship speicific checks
    /// @dev FE should not get here; if either alr requested, friends, or blocked, a friendship will exist
    require(
      LibFriend.getFriendship(components, accountID, targetID) == 0,
      "FriendReq: already exists"
    );

    uint256 incomingReq = LibFriend.getFriendship(components, targetID, accountID);
    if (incomingReq != 0) {
      // either incoming request or blocked (alr friends checked above)
      if (LibString.eq(LibFriend.getState(components, incomingReq), "REQUEST"))
        return abi.encode(LibFriend.accept(world, components, accountID, incomingReq));
      else require(false, "FriendReq: blocked");
    }

    // create request
    uint256 requestID = LibFriend.request(world, components, accountID, targetID);

    LibAccount.updateLastBlock(components, accountID);

    return abi.encode(requestID);
  }

  function executeTyped(address targetAddr) public returns (bytes memory) {
    return execute(abi.encode(targetAddr));
  }
}
