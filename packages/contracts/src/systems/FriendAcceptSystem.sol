// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibString } from "solady/utils/LibString.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibFriend } from "libraries/LibFriend.sol";

uint256 constant ID = uint256(keccak256("system.Friend.Accept"));

contract FriendAcceptSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 reqID = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    require(accountID != 0, "FriendAccept: no account");
    require(LibFriend.isFriendship(components, reqID), "FriendAccept: not a friendship");
    require(
      LibString.eq(LibFriend.getState(components, reqID), "REQUEST"),
      "FriendAccept: not a request"
    );

    // friendship speicific checks
    uint256 recivingID = LibFriend.getTarget(components, reqID);
    require(recivingID == accountID, "FriendAccept: not for you");

    // accept request
    uint256 id = LibFriend.accept(world, components, accountID, reqID);

    LibAccount.updateLastBlock(components, accountID);

    return abi.encode(id);
  }

  function executeTyped(uint256 reqID) public returns (bytes memory) {
    return execute(abi.encode(reqID));
  }
}
