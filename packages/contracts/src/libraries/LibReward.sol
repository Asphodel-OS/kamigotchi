// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";

import { IDParentComponent, ID as IDParentCompID } from "components/IDParentComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibDroptable } from "libraries/LibDroptable.sol";

/**
 * @notice
 * Rewards are similar to Conditionals in that it matches a DescribedEntity (type + index)
 *
 * Shape: deterministicID: (hash("reward.instance", parentID, type, index))
 * - Pointer to parent
 * - Type
 * - Index
 * - Value
 *
 * Two types of rewards: basic (flat items, usually), and Droptable items
 *
 * Primarily used by Goals and Quests.
 * Expected to be on registry entities.
 */
library LibReward {
  using LibString for string;

  /////////////////
  // SHAPES

  /// @notice catchall for both reward types
  function create(
    IUintComp components,
    uint256 parentID,
    string memory type_,
    uint32 index, // optional, only for basic
    uint32[] memory keys, // optional, only for droptable
    uint256[] memory weights, // optional, only for droptable
    uint256 value
  ) internal returns (uint256 id) {
    if (index == 0) {
      // override index for deterministic ID generation if no index provided
      index = getIndexOverride(components, parentID, type_);
    }
    id = genID(parentID, type_, index);
    _create(components, id, parentID, type_, index, keys, weights, value);
  }

  /// @notice catchall for both reward types
  /// @dev allow for ID override
  function _create(
    IUintComp components,
    uint256 id,
    uint256 parentID,
    string memory type_,
    uint32 index, // optional, only for basic
    uint32[] memory keys, // optional, only for droptable
    uint256[] memory weights, // optional, only for droptable
    uint256 value
  ) internal {
    ValueComponent valueComp = ValueComponent(getAddrByID(components, ValueCompID));
    require(!valueComp.has(id), "Reward: already exists");

    // base components
    IDParentComponent(getAddrByID(components, IDParentCompID)).set(id, parentID);
    TypeComponent(getAddrByID(components, TypeCompID)).set(id, type_);
    IndexComponent(getAddrByID(components, IndexCompID)).set(id, index); // droptable index = num of DT in rwd
    valueComp.set(id, value);

    // droptable components
    if (type_.eq("ITEM_DROPTABLE")) {
      LibDroptable.set(components, id, keys, weights);
    }
  }

  function removeAll(IUintComp components, uint256[] memory ids) internal {
    for (uint256 i; i < ids.length; i++) remove(components, ids[i]);
  }

  function remove(IUintComp components, uint256 id) internal {
    IDParentComponent(getAddrByID(components, IDParentCompID)).remove(id);
    TypeComponent(getAddrByID(components, TypeCompID)).remove(id);
    IndexComponent(getAddrByID(components, IndexCompID)).remove(id);
    ValueComponent(getAddrByID(components, ValueCompID)).remove(id);
    LibDroptable.unset(components, id);
  }

  /////////////////
  // INTERACTIONS

  function distribute(
    IWorld world,
    IUintComp components,
    uint256[] memory rwdIDs,
    uint256 multiplier, // multiplies reward value, optional
    uint256 targetID
  ) internal {
    TypeComponent typeComp = TypeComponent(getAddrByID(components, TypeCompID));
    IndexComponent indexComp = IndexComponent(getAddrByID(components, IndexCompID));
    ValueComponent valueComp = ValueComponent(getAddrByID(components, ValueCompID));

    for (uint256 i; i < rwdIDs.length; i++) {
      uint256 rwdID = rwdIDs[i];
      if (rwdID == 0) continue;

      string memory type_ = typeComp.get(rwdID);
      uint256 amt = valueComp.get(rwdID) * multiplier;

      if (type_.eq("ITEM_DROPTABLE")) giveDT(world, components, rwdID, amt, targetID);
      else giveBasic(world, components, type_, indexComp.get(rwdID), amt, targetID);
    }
  }

  /// @notice non multiplying version of distribute
  function distribute(
    IWorld world,
    IUintComp components,
    uint256[] memory rwdIDs,
    uint256 targetID
  ) internal {
    distribute(world, components, rwdIDs, 1, targetID);
  }

  /// @notice distributes basic rewards to an entity
  /// @dev for basic items, no droptables.
  function giveBasic(
    IWorld world,
    IUintComp components,
    string memory type_,
    uint32 index,
    uint256 amount,
    uint256 targetID // expected to be an account
  ) internal {
    LibAccount.incBalanceOf(world, components, targetID, type_, index, amount);
  }

  /// @notice distributes droptable rewards by creating a commit
  /// @dev a commit, reveals done by DroptableRevealSystem
  function giveDT(
    IWorld world,
    IUintComp components,
    uint256 rewardID,
    uint256 amount,
    uint256 targetID // expected to be an account
  ) internal {
    LibDroptable.commit(world, components, rewardID, amount, targetID);
  }

  ////////////////////
  // GETTERS

  /// @notice gets num of reward types attached to a parent entity, use as index override for ID generation
  /** @dev
   * Some reward types don't have indices, number of those entities are used instead
   * - expected: droptables, DISPLAY_ONLY (for goals)
   *
   * all rewards on parent are expected to be deleted and reinitialized when updating,
   * which keeps determinstic position
   */
  function getIndexOverride(
    IUintComp components,
    uint256 parentID,
    string memory type_
  ) internal view returns (uint32) {
    uint256 length = queryByType(components, parentID, type_).length;
    return uint32(length + 1);
  }

  ////////////////////
  // QUERIES

  /// @notice gets rewards attached to a parent entity
  function queryFor(
    IUintComp components,
    uint256 parentID
  ) internal view returns (uint256[] memory) {
    return
      IDParentComponent(getAddrByID(components, IDParentCompID)).getEntitiesWithValue(parentID);
  }

  function queryByType(
    IUintComp components,
    uint256 parentID,
    string memory type_
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(
      QueryType.HasValue,
      getCompByID(components, IDParentCompID),
      abi.encode(parentID)
    );
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getCompByID(components, TypeCompID),
      abi.encode(type_)
    );

    return LibQuery.query(fragments);
  }

  /////////////////
  // IDs

  function genID(
    uint256 parentID,
    string memory type_,
    uint32 index
  ) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("reward.instance", parentID, type_, index)));
  }
}
