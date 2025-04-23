// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibString } from "solady/utils/LibString.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibFriend } from "libraries/LibFriend.sol";

uint256 constant ID = uint256(keccak256("system.friend.accept"));

contract FriendAcceptSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 requestID = abi.decode(arguments, (uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    LibFriend.checkIsFriendship(components, requestID);
    if (!LibFriend.isState(components, requestID, "REQUEST")) revert("FriendAccept: not a request");

    // friendship specific checks
    uint256 senderID = LibFriend.getAccount(components, requestID);
    if (LibFriend.getTarget(components, requestID) != accID) revert("FriendAccept: not for you");

    // check number of friends limit
    uint256 baseLimit = LibConfig.get(components, "FRIENDS_BASE_LIMIT");
    uint256 frenLimit = baseLimit + LibBonus.getForUint256(components, "FRIENDS_LIMIT", accID);
    uint256 senderLimit = baseLimit + LibBonus.getForUint256(components, "FRIENDS_LIMIT", senderID);
    if (LibFriend.getFriendCount(components, accID) >= frenLimit) revert("Friend limit reached");
    if (LibFriend.getFriendCount(components, senderID) >= senderLimit)
      revert("Friend limit reached");

    // accept request; overwrites any previous request/block
    uint256 id = LibFriend.accept(components, accID, senderID, requestID);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    return abi.encode(id);
  }

  function executeTyped(uint256 requestID) public returns (bytes memory) {
    return execute(abi.encode(requestID));
  }
}
