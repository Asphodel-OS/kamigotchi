// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibString } from "solady/utils/LibString.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibFriend } from "libraries/LibFriend.sol";

uint256 constant ID = uint256(keccak256("system.friend.block"));

/**  @notice
 * a generic system to block other accounts
 * if friendship exists, automatically unfriend blockee
 */
contract FriendBlockSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    address targetAddr = abi.decode(arguments, (address));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);
    uint256 targetID = LibAccount.getByOwner(components, targetAddr);

    if (accID == targetID) revert("FriendBlock: cannot block self");

    // remove existing friendship from target->account
    uint256 targetToAcc = LibFriend.getFriendship(components, targetID, accID);
    if (targetToAcc != 0 && !LibFriend.isState(components, targetToAcc, "BLOCKED")) {
      LibFriend.remove(components, targetToAcc);
    }

    // block; account->target friendship (if any) will be overwritten
    uint256 result = LibFriend.create(components, accID, targetID, "BLOCKED");

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    return abi.encode(result);
  }

  function executeTyped(address addr) public returns (bytes memory) {
    return execute(abi.encode(addr));
  }
}
