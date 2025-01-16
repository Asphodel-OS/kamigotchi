// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddrByID } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";

import { BlockRevealComponent as BlockRevComponent, ID as BlockRevealCompID } from "components/BlockRevealComponent.sol";
import { IdSourceComponent, ID as IdSourceCompID } from "components/IdSourceComponent.sol";
import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { KeysComponent, ID as KeysCompID } from "components/KeysComponent.sol";
import { WeightsComponent, ID as WeightsCompID } from "components/WeightsComponent.sol";
import { TimeComponent, ID as TimeCompID } from "components/TimeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { ValuesComponent, ID as ValuesCompID } from "components/ValuesComponent.sol";

import { LibCommit } from "libraries/LibCommit.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibRandom } from "libraries/utils/LibRandom.sol";

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

  /// @notice reveals and distributes items
  /// @dev avoid big array for memory's sake
  function reveal(IUintComp components, uint256[] memory commitIDs) internal {
    // sorted in order of stack depth
    IdSourceComponent idSourceComp = IdSourceComponent(getAddrByID(components, IdSourceCompID));
    IdHolderComponent holderComp = IdHolderComponent(getAddrByID(components, IdHolderCompID));
    BlockRevComponent blockComp = BlockRevComponent(getAddrByID(components, BlockRevealCompID));
    WeightsComponent weightsComp = WeightsComponent(getAddrByID(components, WeightsCompID));
    ValueComponent valComp = ValueComponent(getAddrByID(components, ValueCompID));
    KeysComponent keysComp = KeysComponent(getAddrByID(components, KeysCompID));
    ValuesComponent logComp = ValuesComponent(getAddrByID(components, ValuesCompID));
    TimeComponent timeComp = TimeComponent(getAddrByID(components, TimeCompID));

    for (uint256 i; i < commitIDs.length; i++) {
      uint256 commitID = commitIDs[i];
      if (commitID == 0) continue;

      uint256 dtID = idSourceComp.extract(commitID);
      uint256 holderID = holderComp.extract(commitID);

      uint256[] memory amts = _select(blockComp, weightsComp, valComp, dtID, commitID);
      _distribute(components, keysComp, dtID, amts, holderID);
      log(timeComp, logComp, holderID, dtID, amts);
    }
  }

  /// @notice selects a single droptable result
  /// @dev raw component use for puter efficiency
  function _select(
    BlockRevComponent blockComp,
    WeightsComponent weightsComp,
    ValueComponent valComp,
    uint256 dtID,
    uint256 commitID
  ) internal returns (uint256[] memory) {
    uint256[] memory weights = weightsComp.get(dtID);
    LibRandom.processWeightedRarityInPlace(weights);
    uint256 seed = LibCommit.extractSeedDirect(blockComp, commitID);
    uint256 count = valComp.extract(commitID);

    return LibRandom.selectMultipleFromWeighted(weights, seed, count);
  }

  /// @notice distributes item(s) to holder (single)
  function _distribute(
    IUintComp components,
    KeysComponent keysComp,
    uint256 dtID,
    uint256[] memory amts,
    uint256 holderID
  ) internal {
    uint32[] memory indices = keysComp.get(dtID);
    for (uint256 i; i < indices.length; i++)
      if (amts[i] > 0) LibInventory.incFor(components, holderID, indices[i], amts[i]);
  }

  /// @notice logs the latest reveal result, overwriting previous values
  /// @dev only one exists per account+droptable. a crutch for FE to show latest result
  function log(
    TimeComponent timeComp,
    ValuesComponent valuesComp,
    uint256 holderID,
    uint256 dtID,
    uint256[] memory amts
  ) internal {
    uint256 logID = genLogID(holderID, dtID);
    timeComp.set(logID, block.timestamp);
    valuesComp.set(logID, amts);
  }

  ///////////////////
  // CHECKERS

  function checkAndExtractIsCommit(IUintComp components, uint256[] memory ids) internal {
    string[] memory types = LibCommit.extractTypes(components, ids);
    for (uint256 i; i < ids.length; i++)
      if (!LibString.eq(types[i], "ITEM_DROPTABLE_COMMIT")) revert("not reveal entity");
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
  // UTILS

  function genLogID(uint256 holderID, uint256 dtID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("droptable.item.log", holderID, dtID)));
  }
}
