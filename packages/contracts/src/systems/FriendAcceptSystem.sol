// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibString } from "solady/utils/LibString.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibBonusOld } from "libraries/LibBonusOld.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibFriend } from "libraries/LibFriend.sol";

uint256 constant ID = uint256(keccak256("system.Friend.Accept"));

contract FriendAcceptSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 requestID = abi.decode(arguments, (uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    require(LibFriend.isFriendship(components, requestID), "FriendAccept: not a friendship");
    require(
      LibString.eq(LibFriend.getState(components, requestID), "REQUEST"),
      "FriendAccept: not a request"
    );

    // friendship specific checks
    uint256 senderID = LibFriend.getAccount(components, requestID);
    require(LibFriend.getTarget(components, requestID) == accID, "FriendAccept: not for you");

    // check number of friends limit
    uint256 frenLimit = LibBonusOld.processBonus(
      components,
      accID,
      "FRIENDS_LIMIT",
      LibConfig.get(components, "FRIENDS_BASE_LIMIT")
    );
    require(LibFriend.getFriendCount(components, accID) < frenLimit, "Friend limit reached");

    uint256 senderLimit = LibBonusOld.processBonus(
      components,
      accID,
      "FRIENDS_LIMIT",
      LibConfig.get(components, "FRIENDS_BASE_LIMIT")
    );
    require(LibFriend.getFriendCount(components, senderID) < senderLimit, "Friend limit reached");

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
