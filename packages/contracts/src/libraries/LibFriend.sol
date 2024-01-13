// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";

import { IdAccountComponent, ID as IdAccountCompID } from "components/IdAccountComponent.sol";
import { IdTargetComponent, ID as IdTargetCompID } from "components/IdTargetComponent.sol";
import { IsFriendshipComponent, ID as IsFriendCompID } from "components/IsFriendshipComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibRegister } from "libraries/LibRegister.sol";
import { Strings } from "utils/Strings.sol";

/**
 * @notice friends entities are one way pointers from account A to account B.
 * A friendship has 2 entities, one from A to B and one from B to A.
 */
/// @dev State = [ REQUEST | FRIEND | BLOCKED ]
library LibFriend {
  /////////////////
  // INTERACTIONS

  /// @notice Create a friend request and set initial values.
  function request(
    IWorld world,
    IUintComp components,
    uint256 fromID,
    uint256 toID
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIsFriendship(components, id);
    setAccount(components, id, fromID);
    setTarget(components, id, toID);
    setState(components, id, string("REQUEST"));

    return id;
  }

  /// @notice Accepts a friend request from existing request. Updates request for bidirectional friendship.
  function accept(
    IWorld world,
    IUintComp components,
    uint256 accID,
    uint256 requestID
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIsFriendship(components, id);

    // set account & target - raw component for efficiency
    IdAccountComponent accComp = IdAccountComponent(getAddressById(components, IdAccountCompID));
    accComp.set(id, accID);
    setTarget(components, id, accComp.getValue(requestID));

    // set state - raw component for efficiency
    StateComponent stateComp = StateComponent(getAddressById(components, StateCompID));
    stateComp.set(id, string("FRIEND"));
    stateComp.set(requestID, string("FRIEND"));

    return id;
  }

  /// @notice Blocks another account.
  function block(
    IWorld world,
    IUintComp components,
    uint256 acc,
    uint256 toBlock
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIsFriendship(components, id);
    setAccount(components, id, acc);
    setTarget(components, id, toBlock);
    setState(components, id, string("BLOCKED"));

    return id;
  }

  /// @notice removes a friend entity
  function remove(IUintComp components, uint256 id) internal {
    unsetIsFriendship(components, id);
    unsetAccount(components, id);
    unsetTarget(components, id);
    unsetState(components, id);
  }

  /////////////////
  // CHECKS

  function areFriends(
    IUintComp components,
    uint256 accID,
    uint256 targetID
  ) internal view returns (bool) {
    uint256 friendship = getFriendship(components, accID, targetID);
    return friendship != 0 && LibString.eq(getState(components, friendship), "FRIEND");
  }

  /////////////////
  // GETTERS

  function getAccount(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdAccountComponent(getAddressById(components, IdAccountCompID)).getValue(id);
  }

  function getTarget(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdTargetComponent(getAddressById(components, IdTargetCompID)).getValue(id);
  }

  function getState(IUintComp components, uint256 id) internal view returns (string memory) {
    return StateComponent(getAddressById(components, StateCompID)).getValue(id);
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
    QueryFragment[] memory fragments = new QueryFragment[](3);

    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsFriendCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdAccountCompID),
      abi.encode(accID)
    );
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdTargetCompID),
      abi.encode(targetID)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length == 0) return 0;
    return results[0];
  }

  /// @notice queries all friends for an account
  function getAccountFriends(
    IUintComp components,
    uint256 accID
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](3);

    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsFriendCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdAccountCompID),
      abi.encode(accID)
    );
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, StateCompID),
      abi.encode("FRIEND")
    );

    return LibQuery.query(fragments);
  }

  /// @notice queries all incoming requests for an account
  function getAccountRequests(
    IUintComp components,
    uint256 accID
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](3);

    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsFriendCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdTargetCompID),
      abi.encode(accID)
    );
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, StateCompID),
      abi.encode("REQUEST")
    );

    return LibQuery.query(fragments);
  }
}
