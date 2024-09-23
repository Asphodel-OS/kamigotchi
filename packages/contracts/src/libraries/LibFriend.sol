// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IComponent } from "solecs/interfaces/IComponent.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";

/** world2: revamp friendship IDComponents
 * IDParent (formally IDPointer): to split to something friendship specific (IDOwns?) or IDType is ok too
 * IdAccount, IdTarget: deprecate, change to LibRelation
 */
import { IDParentComponent, ID as IDParentCompID } from "components/IDParentComponent.sol";
import { IdAccountComponent, ID as IdAccountCompID } from "components/IdAccountComponent.sol";
import { IdTargetComponent, ID as IdTargetCompID } from "components/IdTargetComponent.sol";
import { IsFriendshipComponent, ID as IsFriendCompID } from "components/IsFriendshipComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibComp } from "libraries/utils/LibComp.sol";
import { LibData } from "libraries/LibData.sol";
import { Strings } from "utils/Strings.sol";

/**
 * @notice friends entities are one way pointers from account A to account B.
 * A friendship has 2 entities, one from A to B and one from B to A.
 */
/// @dev State = [ REQUEST | FRIEND | BLOCKED ]
library LibFriend {
  using LibComp for IComponent;
  using LibString for string;

  /////////////////
  // INTERACTIONS

  /// @notice create a friendship entity
  function create(
    IUintComp components,
    uint256 accID,
    uint256 targetID,
    string memory state // REQUEST | FRIEND | BLOCKED
  ) internal returns (uint256 id) {
    id = genID(accID, targetID);
    // world2: change to EntityType
    IsFriendshipComponent(getAddrByID(components, IsFriendCompID)).set(id); // TODO: change to EntityType
    IdAccountComponent(getAddrByID(components, IdAccountCompID)).set(id, accID);
    IdTargetComponent(getAddrByID(components, IdTargetCompID)).set(id, targetID);
    StateComponent(getAddrByID(components, StateCompID)).set(id, state);

    if (state.eq("REQUEST")) updateInReqCounter(components, id, targetID);
    else if (state.eq("BLOCKED")) getCompByID(components, IDParentCompID).remove(id);
  }

  /// @notice Accepts a friend request from existing request. Updates request for bidirectional friendship.
  function accept(
    IUintComp components,
    uint256 accID,
    uint256 senderID,
    uint256 requestID
  ) internal returns (uint256 id) {
    id = genID(accID, senderID);
    IsFriendshipComponent(getAddrByID(components, IsFriendCompID)).set(id);
    IdAccountComponent(getAddrByID(components, IdAccountCompID)).set(id, accID);
    IdTargetComponent(getAddrByID(components, IdTargetCompID)).set(id, senderID);

    // set state - raw component for efficiency
    uint256[] memory toUpdates = new uint256[](2);
    toUpdates[0] = requestID;
    toUpdates[1] = id;
    getCompByID(components, StateCompID).setAll(toUpdates, string("FRIEND"));

    // update counters
    updateFriendCounter(components, id, requestID, accID, senderID);
  }

  /// @notice updates friend counter via pointer
  /// @dev used to track number of friends, instrinctly updates req counter
  function updateFriendCounter(
    IUintComp components,
    uint256 accFS,
    uint256 targetFS,
    uint256 accID,
    uint256 targetID
  ) internal {
    uint256[] memory ids = new uint256[](2);
    ids[0] = accFS;
    ids[1] = targetFS;
    uint256[] memory pointers = new uint256[](2);
    pointers[0] = genCounterPtr(accID, "FRIEND");
    pointers[1] = genCounterPtr(targetID, "FRIEND");
    IDParentComponent(getAddrByID(components, IDParentCompID)).setBatch(ids, pointers);
  }

  /// @notice update incoming request counter via pointer
  /// @dev used to track number of incoming requests
  function updateInReqCounter(IUintComp components, uint256 fsID, uint256 targetID) internal {
    IDParentComponent(getAddrByID(components, IDParentCompID)).set(
      fsID,
      genCounterPtr(targetID, "REQUEST")
    );
  }

  /// @notice removes a friend entity
  /// @dev also instrinctly updates pointer
  function remove(IUintComp components, uint256 id) internal {
    unsetIsFriendship(components, id);
    unsetAccount(components, id);
    unsetTarget(components, id);
    unsetState(components, id);
    IDParentComponent(getAddrByID(components, IDParentCompID)).remove(id);
  }

  /////////////////
  // CHECKS

  function areFriends(
    IUintComp components,
    uint256 accID,
    uint256 targetID
  ) internal view returns (bool) {
    uint256 friendship = getFriendship(components, accID, targetID);
    return friendship != 0 && getState(components, friendship).eq("FRIEND");
  }

  /////////////////
  // GETTERS

  function getAccount(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdAccountComponent(getAddrByID(components, IdAccountCompID)).get(id);
  }

  function getTarget(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdTargetComponent(getAddrByID(components, IdTargetCompID)).get(id);
  }

  function getState(IUintComp components, uint256 id) internal view returns (string memory) {
    return StateComponent(getAddrByID(components, StateCompID)).get(id);
  }

  function isFriendship(IUintComp components, uint256 id) internal view returns (bool) {
    return IsFriendshipComponent(getAddrByID(components, IsFriendCompID)).has(id);
  }

  /////////////////
  // SETTERS

  function setAccount(IUintComp components, uint256 id, uint256 accID) internal {
    IdAccountComponent(getAddrByID(components, IdAccountCompID)).set(id, accID);
  }

  function setIsFriendship(IUintComp components, uint256 id) internal {
    IsFriendshipComponent(getAddrByID(components, IsFriendCompID)).set(id);
  }

  function setTarget(IUintComp components, uint256 id, uint256 targetID) internal {
    IdTargetComponent(getAddrByID(components, IdTargetCompID)).set(id, targetID);
  }

  function setState(IUintComp components, uint256 id, string memory state) internal {
    StateComponent(getAddrByID(components, StateCompID)).set(id, state);
  }

  function unsetAccount(IUintComp components, uint256 id) internal {
    IdAccountComponent(getAddrByID(components, IdAccountCompID)).remove(id);
  }

  function unsetIsFriendship(IUintComp components, uint256 id) internal {
    IsFriendshipComponent(getAddrByID(components, IsFriendCompID)).remove(id);
  }

  function unsetTarget(IUintComp components, uint256 id) internal {
    IdTargetComponent(getAddrByID(components, IdTargetCompID)).remove(id);
  }

  function unsetState(IUintComp components, uint256 id) internal {
    StateComponent(getAddrByID(components, StateCompID)).remove(id);
  }

  /////////////////
  // QUERIES

  /// @notice queries relationship from account to target
  function getFriendship(
    IUintComp components,
    uint256 accID,
    uint256 targetID
  ) internal view returns (uint256) {
    uint256 id = genID(accID, targetID);
    return IsFriendshipComponent(getAddrByID(components, IsFriendCompID)).has(id) ? id : 0;
  }

  function getFriendCount(IUintComp components, uint256 accID) internal view returns (uint256) {
    uint256 id = genCounterPtr(accID, "FRIEND");
    return IDParentComponent(getAddrByID(components, IDParentCompID)).size(abi.encode(id));
  }

  function getRequestCount(IUintComp components, uint256 accID) internal view returns (uint256) {
    uint256 id = genCounterPtr(accID, "REQUEST");
    return IDParentComponent(getAddrByID(components, IDParentCompID)).size(abi.encode(id));
  }

  ////////////////////
  // UTILS

  function genID(uint256 accID, uint256 targetID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("friendship", accID, targetID)));
  }

  /// @notice generates a pointer that tracks the an account's friendships based on state
  function genCounterPtr(uint256 accID, string memory state) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("friendship.ptr", accID, state)));
  }
}
