// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";

import { IDAnchorComponent, ID as IDAnchorCompID } from "components/IDAnchorComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibSetter } from "libraries/utils/LibSetter.sol";

import { LibBonus } from "libraries/LibBonus.sol";
import { LibDroptable } from "libraries/LibDroptable.sol";
import { Stat, LibStat } from "libraries/LibStat.sol";

/**
 * @notice
 * Allos are shapes that indicate some sort of a one time distribution of other shapes
 * note: Allos are strictly no takebacksies - ensure reverse mapping is not required post distribution
 *    (entities created must be able to be deleted by other systems (e.g. temp bonuses) or is a balance (e.g. inventory))
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
 * Shape: deterministicID: (hash("reward.instance", anchorID, type, index)) // todo: change to allo.instance
 * - Pointer to parent
 * - Type
 * - Index
 * - Value/stat/droptable
 */
/// todo: rename to Allocation
library LibAllo {
  using LibComp for IUintComp;
  using LibStat for Stat;
  using LibStat for uint256;
  using LibString for string;

  /////////////////
  // SHAPES

  /// @dev some allo types can be overridden
  function createBase(
    IUintComp components,
    uint256 anchorID,
    string memory type_,
    uint32 index,
    bool canOverride
  ) internal returns (uint256 id) {
    id = genID(anchorID, type_, index);
    if (!canOverride) {
      require(!LibEntityType.has(components, id), "Allocation already exists");
    }
    LibEntityType.set(components, id, "ALLOCATION");
    IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).set(id, anchorID);
    TypeComponent(getAddrByID(components, TypeCompID)).set(id, type_);
    IndexComponent(getAddrByID(components, IndexCompID)).set(id, index);
  }

  function createBasic(
    IUintComp components,
    uint256 anchorID,
    string memory type_,
    uint32 index,
    uint256 value
  ) internal returns (uint256 id) {
    id = createBase(components, anchorID, type_, index, false);

    ValueComponent(getAddrByID(components, ValueCompID)).set(id, value);
  }

  /// @notice creates a allo that gives bonuses
  /** @dev
   *   acts differently from other allos. There is only 1 BonusAllo entity per parent.
   *   this is to fit the LibBonus pattern, with multiple bonuses to an anchor
   */
  function createBonus(
    IUintComp components,
    uint256 anchorID,
    string memory bonusType,
    string memory endType,
    uint256 duration,
    int256 value
  ) internal returns (uint256 id) {
    // create base each time, multiple bonuses to same allo
    id = createBase(components, anchorID, "BONUS", 1, true);

    require(!endType.eq(""), "Allo: bonus must be temporary");
    uint256 bonusID = LibBonus.regCreate(components, id, bonusType, endType, duration, value);
  }

  /// @notice this reward type does nothing. its for display.
  function createEmpty(
    IUintComp components,
    uint256 anchorID,
    string memory type_
  ) internal returns (uint256 id) {
    uint32 index = getIndexOverride(components, anchorID, type_);
    id = createBase(components, anchorID, type_, index, false);
  }

  function createDT(
    IUintComp components,
    uint256 anchorID,
    uint32[] memory keys,
    uint256[] memory weights,
    uint256 value // rolls
  ) internal returns (uint256 id) {
    // droptable indexes = num of DT in rwd, for each to be unique
    uint32 index = getIndexOverride(components, anchorID, "ITEM_DROPTABLE");
    id = createBase(components, anchorID, "ITEM_DROPTABLE", index, false);

    LibDroptable.set(components, id, keys, weights);
    ValueComponent(getAddrByID(components, ValueCompID)).set(id, value);
  }

  function createStat(
    IUintComp components,
    uint256 anchorID,
    string memory statType,
    int32 base,
    int32 shift,
    int32 boost,
    int32 sync
  ) internal returns (uint256 id) {
    uint32 index = LibStat.typeToIndex(statType);
    id = createBase(components, anchorID, "STAT", index, false);

    uint256 value = Stat(base, shift, boost, sync).toUint(); // store in raw form
    ValueComponent(getAddrByID(components, ValueCompID)).set(id, value);
  }

  function remove(IUintComp components, uint256[] memory ids) internal {
    LibEntityType.remove(components, ids);
    IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).remove(ids);
    TypeComponent(getAddrByID(components, TypeCompID)).remove(ids);
    IndexComponent(getAddrByID(components, IndexCompID)).remove(ids);
    ValueComponent(getAddrByID(components, ValueCompID)).remove(ids);
    LibDroptable.remove(components, ids);
    LibBonus.regRemoveByAnchor(components, ids);
  }

  function remove(IUintComp components, uint256 id) internal {
    LibEntityType.remove(components, id);
    IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).remove(id);
    TypeComponent(getAddrByID(components, TypeCompID)).remove(id);
    IndexComponent(getAddrByID(components, IndexCompID)).remove(id);
    ValueComponent(getAddrByID(components, ValueCompID)).remove(id);
    LibDroptable.remove(components, id);
    LibBonus.regRemoveByAnchor(components, id);
  }

  /////////////////
  // INTERACTIONS

  function distribute(
    IWorld world,
    IUintComp components,
    uint256[] memory alloIDs,
    uint256 mult, // multiplies reward value, optional
    uint256 targetID
  ) internal {
    TypeComponent typeComp = TypeComponent(getAddrByID(components, TypeCompID));
    IndexComponent indexComp = IndexComponent(getAddrByID(components, IndexCompID));
    ValueComponent valueComp = ValueComponent(getAddrByID(components, ValueCompID));

    for (uint256 i; i < alloIDs.length; i++) {
      uint256 alloID = alloIDs[i];
      if (alloID == 0) continue;

      string memory type_ = typeComp.get(alloID);
      uint256 amt = valueComp.safeGet(alloID);

      if (type_.eq("ITEM_DROPTABLE")) giveDT(world, components, alloID, amt, mult, targetID);
      else if (type_.eq("STAT")) giveStat(components, indexComp.get(alloID), amt, mult, targetID);
      else if (type_.eq("BONUS")) giveBonus(components, alloID, mult, targetID);
      else giveBasic(world, components, type_, indexComp.get(alloID), amt, mult, targetID);
    }
  }

  /// @notice non multiplying version of distribute
  function distribute(
    IWorld world,
    IUintComp components,
    uint256[] memory alloIDs,
    uint256 targetID
  ) internal {
    distribute(world, components, alloIDs, 1, targetID);
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
    LibSetter.update(world, components, type_, index, amount * mult, targetID);
  }

  function giveBonus(
    IUintComp components,
    uint256 alloID,
    uint256 mult,
    uint256 targetID
  ) internal {
    LibBonus.assignTemporary(components, alloID, targetID);
  }

  /// @notice distributes droptable rewards by creating a commit
  /// @dev a commit, reveals done by DroptableRevealSystem
  function giveDT(
    IWorld world,
    IUintComp components,
    uint256 alloID,
    uint256 amount,
    uint256 mult,
    uint256 targetID // expected to be an account
  ) internal {
    LibDroptable.commit(world, components, alloID, amount * mult, targetID);
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
    uint256 anchorID,
    string memory type_
  ) internal view returns (uint32) {
    uint256 length = queryByType(components, anchorID, type_).length;
    return uint32(length + 1);
  }

  ////////////////////
  // QUERIES

  /// @notice gets rewards attached to a parent entity
  function queryFor(
    IUintComp components,
    uint256 anchorID
  ) internal view returns (uint256[] memory) {
    return IUintComp(getAddrByID(components, IDAnchorCompID)).getEntitiesWithValue(anchorID);
  }

  function queryFor(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (uint256[] memory) {
    return IUintComp(getAddrByID(components, IDAnchorCompID)).getEntitiesWithValue(ids);
  }

  function queryByType(
    IUintComp components,
    uint256 anchorID,
    string memory type_
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(
      QueryType.HasValue,
      getCompByID(components, IDAnchorCompID),
      abi.encode(anchorID)
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
    uint256 anchorID,
    string memory type_,
    uint32 index
  ) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("reward.instance", anchorID, type_, index)));
  }
}
