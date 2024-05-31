// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IComponent } from "solecs/interfaces/IComponent.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";

import { IdAccountComponent, ID as IdAccountCompID } from "components/IdAccountComponent.sol";
import { IDPointerComponent, ID as IDPointerCompID } from "components/IDPointerComponent.sol";
import { IdTargetComponent, ID as IdTargetCompID } from "components/IdTargetComponent.sol";
import { IsFriendshipComponent, ID as IsFriendCompID } from "components/IsFriendshipComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibComp } from "libraries/utils/LibComp.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
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
    IsFriendshipComponent(getAddressById(components, IsFriendCompID)).set(id);
    IdAccountComponent(getAddressById(components, IdAccountCompID)).set(id, accID);
    IdTargetComponent(getAddressById(components, IdTargetCompID)).set(id, targetID);
    StateComponent(getAddressById(components, StateCompID)).set(id, state);

    if (state.eq("REQUEST")) updateInReqCounter(components, id, targetID);
    else if (state.eq("BLOCKED")) getComponentById(components, IDPointerCompID).remove(id);
  }

  /// @notice Accepts a friend request from existing request. Updates request for bidirectional friendship.
  function accept(
    IUintComp components,
    uint256 accID,
    uint256 senderID,
    uint256 requestID
  ) internal returns (uint256 id) {
    id = genID(accID, senderID);
    IsFriendshipComponent(getAddressById(components, IsFriendCompID)).set(id);
    IdAccountComponent(getAddressById(components, IdAccountCompID)).set(id, accID);
    IdTargetComponent(getAddressById(components, IdTargetCompID)).set(id, senderID);

    // set state - raw component for efficiency
    uint256[] memory toUpdates = new uint256[](2);
    toUpdates[0] = requestID;
    toUpdates[1] = id;
    getComponentById(components, StateCompID).setAll(toUpdates, string("FRIEND"));

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
    IDPointerComponent(getAddressById(components, IDPointerCompID)).setBatch(ids, pointers);
  }

  /// @notice update incoming request counter via pointer
  /// @dev used to track number of incoming requests
  function updateInReqCounter(IUintComp components, uint256 fsID, uint256 targetID) internal {
    IDPointerComponent(getAddressById(components, IDPointerCompID)).set(
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
    IDPointerComponent(getAddressById(components, IDPointerCompID)).remove(id);
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
    return IdAccountComponent(getAddressById(components, IdAccountCompID)).get(id);
  }

  function getTarget(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdTargetComponent(getAddressById(components, IdTargetCompID)).get(id);
  }

  function getState(IUintComp components, uint256 id) internal view returns (string memory) {
    return StateComponent(getAddressById(components, StateCompID)).get(id);
  }

  function isFriendship(IUintComp components, uint256 id) internal view returns (bool) {
    return IsFriendshipComponent(getAddressById(components, IsFriendCompID)).has(id);
  }

  /////////////////
  // SETTERS

  function setAccount(IUintComp components, uint256 id, uint256 accountID) internal {
    IdAccountComponent(getAddressById(components, IdAccountCompID)).set(id, accountID);
  }

  function setIsFriendship(IUintComp components, uint256 id) internal {
    IsFriendshipComponent(getAddressById(components, IsFriendCompID)).set(id);
  }

  function setTarget(IUintComp components, uint256 id, uint256 targetID) internal {
    IdTargetComponent(getAddressById(components, IdTargetCompID)).set(id, targetID);
  }

  function setState(IUintComp components, uint256 id, string memory state) internal {
    StateComponent(getAddressById(components, StateCompID)).set(id, state);
  }

  function unsetAccount(IUintComp components, uint256 id) internal {
    IdAccountComponent(getAddressById(components, IdAccountCompID)).remove(id);
  }

  function unsetIsFriendship(IUintComp components, uint256 id) internal {
    IsFriendshipComponent(getAddressById(components, IsFriendCompID)).remove(id);
  }

  function unsetTarget(IUintComp components, uint256 id) internal {
    IdTargetComponent(getAddressById(components, IdTargetCompID)).remove(id);
  }

  function unsetState(IUintComp components, uint256 id) internal {
    StateComponent(getAddressById(components, StateCompID)).remove(id);
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
    return IsFriendshipComponent(getAddressById(components, IsFriendCompID)).has(id) ? id : 0;
  }

  function getFriendCount(IUintComp components, uint256 accID) internal view returns (uint256) {
    uint256 id = genCounterPtr(accID, "FRIEND");
    return IDPointerComponent(getAddressById(components, IDPointerCompID)).size(abi.encode(id));
  }

  function getRequestCount(IUintComp components, uint256 accID) internal view returns (uint256) {
    uint256 id = genCounterPtr(accID, "REQUEST");
    return IDPointerComponent(getAddressById(components, IDPointerCompID)).size(abi.encode(id));
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
