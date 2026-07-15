// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddrByID } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";
import { LibTypes } from "solecs/LibTypes.sol";

import { BlockRevealComponent as BlockRevComponent, ID as BlockRevealCompID } from "components/BlockRevealComponent.sol";
import { IdSourceComponent, ID as IdSourceCompID } from "components/IdSourceComponent.sol";
import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { KeysComponent, ID as KeysCompID } from "components/KeysComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { WeightsComponent, ID as WeightsCompID } from "components/WeightsComponent.sol";
import { TimeComponent, ID as TimeCompID } from "components/TimeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { ValuesComponent, ID as ValuesCompID } from "components/ValuesComponent.sol";

import { LibCommit } from "libraries/LibCommit.sol";
import { LibData } from "libraries/LibData.sol";
import { LibEmitter } from "libraries/utils/LibEmitter.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibRandom } from "libraries/utils/LibRandom.sol";

// max rolls a single reveal transaction may process. reveal cost scales with a
// commit's roll count; a large scavenge claim can mint one commit too big to
// reveal within the block gas limit, which strands it forever. commits above
// this cap drain across multiple transactions instead.
uint256 constant MAX_ROLLS_PER_REVEAL = 5000;

library LibDroptable {
  /**
   * @notice creates a reveal entity for an item droptable
   *   used for all item droptables, including lootboxes.
   *   Parent context may choose to add a "subType" for FE distinction
   **/
  function commit(
    IWorld world,
    IUintComp components,
    uint256 dtID,
    uint256 count,
    uint256 accID
  ) internal returns (uint256 id) {
    id = LibCommit.commit(world, components, accID, block.number, "ITEM_DROPTABLE_COMMIT");
    IdSourceComponent(getAddrByID(components, IdSourceCompID)).set(id, dtID);
    ValueComponent(getAddrByID(components, ValueCompID)).set(id, count);
  }

  ///////////////////
  // INTERACTIONS

  /// @notice reveals and distributes items, bounded to MAX_ROLLS_PER_REVEAL per tx
  /// @dev a commit larger than the remaining budget keeps its remainder and is
  ///      revealed again on a later tx; commits past the budget wait their turn
  function reveal(IWorld world, IUintComp components, uint256[] memory commitIDs) internal {
    uint256 budget = MAX_ROLLS_PER_REVEAL;
    for (uint256 i; i < commitIDs.length; i++) {
      if (budget == 0) break;
      if (commitIDs[i] == 0) continue;
      budget -= _revealSingle(world, components, commitIDs[i], budget);
    }
  }

  /// @notice reveals and distributes up to `budget` rolls of a single commit
  /// @dev returns the number of rolls processed. reads (does not extract) the
  ///      commit shape so a partially-revealed commit stays revealable; the
  ///      commit is deleted only once fully drained
  function _revealSingle(
    IWorld world,
    IUintComp components,
    uint256 commitID,
    uint256 budget
  ) internal returns (uint256 chunk) {
    ValueComponent valComp = ValueComponent(getAddrByID(components, ValueCompID));
    uint256 remaining = valComp.get(commitID);
    chunk = remaining > budget ? budget : remaining;

    _distributeChunk(world, components, commitID, remaining, chunk);

    if (chunk == remaining) _consume(components, commitID);
    else valComp.set(commitID, remaining - chunk);
  }

  /// @dev split out of _revealSingle to keep the stack shallow
  function _distributeChunk(
    IWorld world,
    IUintComp components,
    uint256 commitID,
    uint256 remaining,
    uint256 chunk
  ) internal {
    uint256 dtID = IdSourceComponent(getAddrByID(components, IdSourceCompID)).get(commitID);
    uint256 holderID = IdHolderComponent(getAddrByID(components, IdHolderCompID)).get(commitID);

    uint256[] memory amts = _select(
      BlockRevComponent(getAddrByID(components, BlockRevealCompID)),
      WeightsComponent(getAddrByID(components, WeightsCompID)),
      dtID,
      commitID,
      remaining,
      chunk
    );
    uint32[] memory indices = KeysComponent(getAddrByID(components, KeysCompID)).get(dtID);

    _distribute(components, indices, amts, holderID);
    emitRevealEvent(world, commitID, holderID, dtID, indices, amts);
    logLatest(
      TimeComponent(getAddrByID(components, TimeCompID)),
      ValuesComponent(getAddrByID(components, ValuesCompID)),
      holderID,
      dtID,
      amts
    ); // latest result, to show on FE
  }

  /// @notice selects `chunk` droptable results
  /// @dev raw component use for puter efficiency. a commit that fully drains this
  ///      call uses the legacy seed verbatim (result identical to a single-pass
  ///      reveal); a chunk that leaves a remainder is nonced by `remaining` so
  ///      chunks never collide. the outcome is fixed at the commit block either way
  function _select(
    BlockRevComponent blockComp,
    WeightsComponent weightsComp,
    uint256 dtID,
    uint256 commitID,
    uint256 remaining,
    uint256 chunk
  ) internal view returns (uint256[] memory) {
    uint256[] memory weights = weightsComp.get(dtID);
    LibRandom.processWeightedRarityInPlace(weights);

    uint256 base = LibCommit.seedDirect(blockComp, commitID);
    uint256 seed = chunk == remaining
      ? base
      : uint256(keccak256(abi.encodePacked(base, remaining)));

    return LibRandom.selectMultipleFromWeighted(weights, seed, chunk);
  }

  /// @notice deletes a fully-drained commit
  function _consume(IUintComp components, uint256 commitID) internal {
    IdSourceComponent(getAddrByID(components, IdSourceCompID)).remove(commitID);
    IdHolderComponent(getAddrByID(components, IdHolderCompID)).remove(commitID);
    ValueComponent(getAddrByID(components, ValueCompID)).remove(commitID);
    BlockRevComponent(getAddrByID(components, BlockRevealCompID)).remove(commitID);
    TypeComponent(getAddrByID(components, TypeCompID)).remove(commitID);
  }

  /// @notice distributes item(s) to holder (single)
  function _distribute(
    IUintComp components,
    uint32[] memory indices,
    uint256[] memory amts,
    uint256 holderID
  ) internal {
    for (uint256 i; i < indices.length; i++) {
      if (amts[i] > 0) {
        LibInventory.incFor(components, holderID, indices[i], amts[i]);
        logTotal(components, holderID, indices[i], amts[i]); // log total items received
      }
    }
  }

  /// @notice logs the latest reveal result, overwriting previous values
  /// @dev only one exists per account+droptable. a crutch for FE to show latest result
  function logLatest(
    TimeComponent timeComp,
    ValuesComponent valuesComp,
    uint256 holderID,
    uint256 dtID,
    uint256[] memory amts
  ) internal {
    uint256 logID = genLatestLogID(holderID, dtID);
    timeComp.set(logID, block.timestamp);
    valuesComp.set(logID, amts);
  }

  ///////////////////
  // CHECKERS

  /// @dev non-destructive: leaves the Type in place so a partially-revealed
  ///      commit can be checked again on its next reveal tx. skips zeroed ids
  ///      (already-drained commits filtered out by LibCommit.filterInvalid)
  function checkIsCommit(IUintComp components, uint256[] memory ids) internal view {
    TypeComponent typeComp = TypeComponent(getAddrByID(components, TypeCompID));
    for (uint256 i; i < ids.length; i++) {
      if (ids[i] == 0) continue;
      if (!LibString.eq(typeComp.safeGet(ids[i]), "ITEM_DROPTABLE_COMMIT")) revert("not reveal entity");
    }
  }

  /////////////////
  // SETTERS

  function set(
    IUintComp components,
    uint256 id,
    uint32[] memory keys,
    uint256[] memory weights
  ) internal {
    KeysComponent(getAddrByID(components, KeysCompID)).set(id, keys);
    WeightsComponent(getAddrByID(components, WeightsCompID)).set(id, weights);
  }

  function remove(IUintComp components, uint256 id) internal {
    KeysComponent(getAddrByID(components, KeysCompID)).remove(id);
    WeightsComponent(getAddrByID(components, WeightsCompID)).remove(id);
  }

  function remove(IUintComp components, uint256[] memory ids) internal {
    KeysComponent(getAddrByID(components, KeysCompID)).remove(ids);
    WeightsComponent(getAddrByID(components, WeightsCompID)).remove(ids);
  }

  /////////////////
  // LOGGING

  function logTotal(IUintComp components, uint256 holderID, uint32 index, uint256 amt) internal {
    LibData.inc(components, holderID, index, "DROPTABLE_ITEM_TOTAL", amt);
  }

  function emitRevealEvent(
    IWorld world,
    uint256 commitID,
    uint256 holderID,
    uint256 dtID,
    uint32[] memory indices,
    uint256[] memory amounts
  ) internal {
    DroptableRevealEventData memory eventData = DroptableRevealEventData({
      commitID: commitID,
      holderID: holderID,
      dtID: dtID,
      timestamp: block.timestamp,
      itemIndices: indices,
      itemAmounts: amounts
    });

    LibEmitter.emitEvent(world, "DROPTABLE_REVEAL", _schema(), _encodeDroptableRevealEvent(eventData));
  }

  struct DroptableRevealEventData {
    uint256 commitID;
    uint256 holderID;
    uint256 dtID;
    uint256 timestamp;
    uint32[] itemIndices;
    uint256[] itemAmounts;
  }

  function _schema() internal pure returns (uint8[] memory) {
    uint8[] memory schema = new uint8[](6);
    schema[0] = uint8(LibTypes.SchemaValue.UINT256);      // commitID
    schema[1] = uint8(LibTypes.SchemaValue.UINT256);      // holderID
    schema[2] = uint8(LibTypes.SchemaValue.UINT256);      // dtID
    schema[3] = uint8(LibTypes.SchemaValue.UINT256);      // timestamp
    schema[4] = uint8(LibTypes.SchemaValue.UINT32_ARRAY); // itemIndices
    schema[5] = uint8(LibTypes.SchemaValue.UINT256_ARRAY);// itemAmounts
    return schema;
  }

  function _encodeDroptableRevealEvent(DroptableRevealEventData memory data) internal pure returns (bytes memory) {
    return abi.encode(data.commitID, data.holderID, data.dtID, data.timestamp, data.itemIndices, data.itemAmounts);
  }

  /////////////////
  // IDs

  function genLatestLogID(uint256 holderID, uint256 dtID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("droptable.item.log", holderID, dtID)));
  }
}
