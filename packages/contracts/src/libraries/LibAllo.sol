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

import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibSetter } from "libraries/utils/LibSetter.sol";

import { LibDroptable } from "libraries/LibDroptable.sol";
import { Stat, LibStat } from "libraries/LibStat.sol";

/**
 * @notice
 * Allos are shapes that indicate some sort of distribution of other shapes
 * - similar to Conditionals in that it matches a DescribedEntity (type + index)
 * - Can give
 *   - bonuses (unimplemented)
 *   - items
 *   - droptable (commit)
 *   - reputation
 *   - quests (unimplemented)
 *   - stats
 *   - flags
 *
 * Shape: deterministicID: (hash("reward.instance", parentID, type, index)) // todo: change to allo.instance
 * - Pointer to parent
 * - Type
 * - Index
 * - Value/stat/droptable
 */
/// todo: rename to Allocation
library LibAllo {
  using LibStat for Stat;
  using LibStat for uint256;
  using LibString for string;

  /////////////////
  // SHAPES

  /// @dev allow for ID override
  function createBase(
    IUintComp components,
    uint256 parentID,
    string memory type_,
    uint32 index
  ) internal returns (uint256 id) {
    id = genID(parentID, type_, index);
    require(!LibEntityType.checkAndSet(components, id, "ALLOCATION"), "Allocation already exists");

    IDParentComponent(getAddrByID(components, IDParentCompID)).set(id, parentID);
    TypeComponent(getAddrByID(components, TypeCompID)).set(id, type_);
    IndexComponent(getAddrByID(components, IndexCompID)).set(id, index);
  }

  function createBasic(
    IUintComp components,
    uint256 parentID,
    string memory type_,
    uint32 index,
    uint256 value
  ) internal returns (uint256 id) {
    id = createBase(components, parentID, type_, index);

    ValueComponent(getAddrByID(components, ValueCompID)).set(id, value);
  }

  /// @notice this reward type does nothing. its for display.
  function createEmpty(
    IUintComp components,
    uint256 parentID,
    string memory type_
  ) internal returns (uint256 id) {
    uint32 index = getIndexOverride(components, parentID, type_);
    id = createBase(components, parentID, type_, index);
  }

  function createDT(
    IUintComp components,
    uint256 parentID,
    uint32[] memory keys,
    uint256[] memory weights,
    uint256 value // rolls
  ) internal returns (uint256 id) {
    // droptable indexes = num of DT in rwd, for each to be unique
    uint32 index = getIndexOverride(components, parentID, "ITEM_DROPTABLE");
    id = createBase(components, parentID, "ITEM_DROPTABLE", index);

    LibDroptable.set(components, id, keys, weights);
    ValueComponent(getAddrByID(components, ValueCompID)).set(id, value);
  }

  function createStat(
    IUintComp components,
    uint256 parentID,
    string memory statType,
    int32 base,
    int32 shift,
    int32 boost,
    int32 sync
  ) internal returns (uint256 id) {
    uint32 index = LibStat.typeToIndex(statType);
    id = createBase(components, parentID, "STAT", index);

    uint256 value = Stat(base, shift, boost, sync).toUint(); // store in raw form
    ValueComponent(getAddrByID(components, ValueCompID)).set(id, value);
  }

  function remove(IUintComp components, uint256[] memory ids) internal {
    IDParentComponent(getAddrByID(components, IDParentCompID)).remove(ids);
    TypeComponent(getAddrByID(components, TypeCompID)).remove(ids);
    IndexComponent(getAddrByID(components, IndexCompID)).remove(ids);
    ValueComponent(getAddrByID(components, ValueCompID)).remove(ids);
    LibDroptable.remove(components, ids);
  }

  function remove(IUintComp components, uint256 id) internal {
    LibEntityType.remove(components, id);
    IDParentComponent(getAddrByID(components, IDParentCompID)).remove(id);
    TypeComponent(getAddrByID(components, TypeCompID)).remove(id);
    IndexComponent(getAddrByID(components, IndexCompID)).remove(id);
    ValueComponent(getAddrByID(components, ValueCompID)).remove(id);
    LibDroptable.remove(components, id);
  }

  /////////////////
  // INTERACTIONS

  function distribute(
    IWorld world,
    IUintComp components,
    uint256[] memory rwdIDs,
    uint256 mult, // multiplies reward value, optional
    uint256 targetID
  ) internal {
    TypeComponent typeComp = TypeComponent(getAddrByID(components, TypeCompID));
    IndexComponent indexComp = IndexComponent(getAddrByID(components, IndexCompID));
    ValueComponent valueComp = ValueComponent(getAddrByID(components, ValueCompID));

    for (uint256 i; i < rwdIDs.length; i++) {
      uint256 rwdID = rwdIDs[i];
      if (rwdID == 0) continue;

      string memory type_ = typeComp.get(rwdID);
      uint256 amt = valueComp.get(rwdID);

      if (type_.eq("ITEM_DROPTABLE")) giveDT(world, components, rwdID, amt, mult, targetID);
      else if (type_.eq("STAT")) giveStat(components, indexComp.get(rwdID), amt, mult, targetID);
      else giveBasic(world, components, type_, indexComp.get(rwdID), amt, mult, targetID);
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
    uint256 mult,
    uint256 targetID // expected to be an account
  ) internal {
    LibSetter.inc(world, components, type_, index, amount * mult, targetID);
  }

  /// @notice distributes droptable rewards by creating a commit
  /// @dev a commit, reveals done by DroptableRevealSystem
  function giveDT(
    IWorld world,
    IUintComp components,
    uint256 rewardID,
    uint256 amount,
    uint256 mult,
    uint256 targetID // expected to be an account
  ) internal {
    LibDroptable.commit(world, components, rewardID, amount * mult, targetID);
  }

  /// @notice applies a stat to target
  /// @dev 1 stat comp = 1 index
  function giveStat(
    IUintComp components,
    uint32 index,
    uint256 rawStat,
    uint256 mult,
    uint256 targetID
  ) internal {
    return
      LibStat.modify(
        components,
        LibStat.indexToCompID(index),
        rawStat.toStat().multiply(mult), // converts raw uint to stat and multiply
        targetID
      );
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
