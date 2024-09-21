// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { IDPointerComponent, ID as IDPointerCompID } from "components/IDPointerComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibDroptable } from "libraries/LibDroptable.sol";

/**
 * @notice
 * Rewards are similar to Conditionals in that it matches a DescribedEntity (type + index)
 *
 * Shape: non-fixed ID
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
    IWorld world,
    IUintComp components,
    uint256 pointerID,
    string memory type_,
    uint32 index, // optional, only for basic
    uint32[] memory keys, // optional, only for droptable
    uint256[] memory weights, // optional, only for droptable
    uint256 value
  ) internal returns (uint256 id) {
    id = _create(world, components, pointerID, type_, value);
    if (type_.eq("ITEM_DROPTABLE")) addDT(components, id, keys, weights);
    else addBasic(components, id, index);
  }

  function addBasic(IUintComp components, uint256 id, uint32 index) internal {
    IndexComponent(getAddrByID(components, IndexCompID)).set(id, index);
  }

  function addDT(
    IUintComp components,
    uint256 id,
    uint32[] memory keys,
    uint256[] memory weights
  ) internal {
    LibDroptable.set(components, id, keys, weights);
  }

  function _create(
    IWorld world,
    IUintComp components,
    uint256 pointerID,
    string memory type_,
    uint256 value
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    IDPointerComponent(getAddrByID(components, IDPointerCompID)).set(id, pointerID);
    TypeComponent(getAddrByID(components, TypeCompID)).set(id, type_);
    ValueComponent(getAddrByID(components, ValueCompID)).set(id, value);
  }

  function removeAll(IUintComp components, uint256[] memory ids) internal {
    for (uint256 i; i < ids.length; i++) remove(components, ids[i]);
  }

  function remove(IUintComp components, uint256 id) internal {
    IDPointerComponent(getAddrByID(components, IDPointerCompID)).remove(id);
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
  // QUERIES

  /// @notice gets rewards attached to a parent entity
  function queryFor(
    IUintComp components,
    uint256 parentID
  ) internal view returns (uint256[] memory) {
    return
      IDPointerComponent(getAddrByID(components, IDPointerCompID)).getEntitiesWithValue(parentID);
  }
}
