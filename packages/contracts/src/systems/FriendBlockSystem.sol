// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibString } from "solady/utils/LibString.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibFriend } from "libraries/LibFriend.sol";

uint256 constant ID = uint256(keccak256("system.Friend.Block"));

/// @notice a generic system to block other accounts
contract FriendBlockSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    address targetAddr = abi.decode(arguments, (address));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    uint256 targetID = LibAccount.getByOwner(components, targetAddr);

    require(accountID != 0, "FriendBlock: no account");
    require(targetID != 0, "FriendBlock: target no account");
    require(accountID != targetID, "FriendBlock: cannot block self");

    // query for exisiting friendship from account to target
    uint256 accToTar = LibFriend.getFriendship(components, accountID, targetID);
    if (accToTar != 0) {
      require(
        !LibString.eq(LibFriend.getState(components, accToTar), "BLOCKED"),
        "FriendBlock: already blocked"
      );
      LibFriend.remove(components, accToTar);
    }

    // query for exisiting friendship from target to account
    uint256 tarToAcc = LibFriend.getFriendship(components, targetID, accountID);
    if (tarToAcc != 0 && !LibString.eq(LibFriend.getState(components, tarToAcc), "BLOCKED"))
      LibFriend.remove(components, tarToAcc);

    // block
    uint256 result = LibFriend.block(world, components, accountID, targetID);

    LibAccount.updateLastBlock(components, accountID);

    return abi.encode(result);
  }

  function executeTyped(address addr) public returns (bytes memory) {
    return execute(abi.encode(addr));
  }
}
