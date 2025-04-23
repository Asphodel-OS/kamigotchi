// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IComponent } from "solecs/interfaces/IComponent.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";

/** world2: revamp friendship IDComponents
 * IDAnchor (formally IDPointer): to split to something friendship specific (IDOwns?) or IDType is ok too
 */
import { IDAnchorComponent, ID as IDAnchorCompID } from "components/IDAnchorComponent.sol";
import { IdSourceComponent, ID as IdSourceCompID } from "components/IdSourceComponent.sol";
import { IdTargetComponent, ID as IdTargetCompID } from "components/IdTargetComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";

import { LibAccount } from "libraries/LibAccount.sol";
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
    LibEntityType.set(components, id, "FRIENDSHIP");
    IdSourceComponent(getAddrByID(components, IdSourceCompID)).set(id, accID);
    IdTargetComponent(getAddrByID(components, IdTargetCompID)).set(id, targetID);
    StateComponent(getAddrByID(components, StateCompID)).set(id, state);

    if (state.eq("REQUEST")) updateInReqCounter(components, id, targetID);
    else if (state.eq("BLOCKED")) getCompByID(components, IDAnchorCompID).remove(id);
  }

  /// @notice Accepts a friend request from existing request. Updates request for bidirectional friendship.
  function accept(
    IUintComp components,
    uint256 accID,
    uint256 senderID,
    uint256 requestID
  ) internal returns (uint256 id) {
    id = genID(accID, senderID);
    LibEntityType.set(components, id, "FRIENDSHIP");
    IdSourceComponent(getAddrByID(components, IdSourceCompID)).set(id, accID);
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
    IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).set(ids, pointers);
  }

  /// @notice update incoming request counter via pointer
  /// @dev used to track number of incoming requests
  function updateInReqCounter(IUintComp components, uint256 fsID, uint256 targetID) internal {
    IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).set(
      fsID,
      genCounterPtr(targetID, "REQUEST")
    );
  }

  /// @notice removes a friend entity
  /// @dev also instrinctly updates pointer
  function remove(IUintComp components, uint256 id) internal {
    LibEntityType.remove(components, id);
    IdSourceComponent(getAddrByID(components, IdSourceCompID)).remove(id);
    IdTargetComponent(getAddrByID(components, IdTargetCompID)).remove(id);
    StateComponent(getAddrByID(components, StateCompID)).remove(id);
    IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).remove(id);
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

  function checkIsFriendship(IUintComp components, uint256 id) internal view {
    if (!LibEntityType.isShape(components, id, "FRIENDSHIP")) revert("not friendship");
  }

  function isState(
    IUintComp components,
    uint256 id,
    string memory state
  ) internal view returns (bool) {
    return getCompByID(components, StateCompID).eqString(id, state);
  }

  /////////////////
  // GETTERS

  function getAccount(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdSourceComponent(getAddrByID(components, IdSourceCompID)).get(id);
  }

  function getTarget(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdTargetComponent(getAddrByID(components, IdTargetCompID)).get(id);
  }

  function getState(IUintComp components, uint256 id) internal view returns (string memory) {
    return StateComponent(getAddrByID(components, StateCompID)).get(id);
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
    return LibEntityType.isShape(components, id, "FRIENDSHIP") ? id : 0;
  }

  function getFriendCount(IUintComp components, uint256 accID) internal view returns (uint256) {
    uint256 id = genCounterPtr(accID, "FRIEND");
    return IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).size(abi.encode(id));
  }

  function getRequestCount(IUintComp components, uint256 accID) internal view returns (uint256) {
    uint256 id = genCounterPtr(accID, "REQUEST");
    return IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).size(abi.encode(id));
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
