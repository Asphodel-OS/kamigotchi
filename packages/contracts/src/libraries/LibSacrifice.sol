// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddrByID } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";
import { LibTypes } from "solecs/LibTypes.sol";

import { BlockRevealComponent as BlockRevComponent, ID as BlockRevealCompID } from "components/BlockRevealComponent.sol";
import { IDOwnsKamiComponent, ID as IDOwnsKamiCompID } from "components/IDOwnsKamiComponent.sol";
import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IdSourceComponent, ID as IdSourceCompID } from "components/IdSourceComponent.sol";
import { KeysComponent, ID as KeysCompID } from "components/KeysComponent.sol";
import { TimeComponent, ID as TimeCompID } from "components/TimeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { ValuesComponent, ID as ValuesCompID } from "components/ValuesComponent.sol";
import { WeightsComponent, ID as WeightsCompID } from "components/WeightsComponent.sol";

import { LibCommit } from "libraries/LibCommit.sol";
import { LibData } from "libraries/LibData.sol";
import { LibEmitter } from "libraries/utils/LibEmitter.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibKami721 } from "libraries/LibKami721.sol";
import { LibRandom } from "libraries/utils/LibRandom.sol";

// Burn address for sacrificed kamis
address constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

// Droptable IDs
uint256 constant SACRIFICE_DT_NORMAL = uint256(keccak256("droptable.sacrifice.normal"));
uint256 constant SACRIFICE_DT_UNCOMMON_PITY = uint256(keccak256("droptable.sacrifice.uncommon"));
uint256 constant SACRIFICE_DT_RARE_PITY = uint256(keccak256("droptable.sacrifice.rare"));

// Pity thresholds
uint256 constant UNCOMMON_PITY_THRESHOLD = 20;
uint256 constant RARE_PITY_THRESHOLD = 100;

/**
 * @title LibSacrifice
 * @notice Library for kami sacrifice mechanics with pity system
 * @dev Implements a commit/reveal pattern for fair randomness
 *
 * Pity System:
 * - Every 20 sacrifices: guaranteed uncommon item from uncommon pity table
 * - Every 100 sacrifices: guaranteed rare item from rare pity table
 * - Rare pity takes precedence over uncommon pity
 */
library LibSacrifice {
  /////////////////
  // COMMIT

  /**
   * @notice Creates a sacrifice commit entity
   * @param world The world contract
   * @param components Component registry
   * @param kamiID The kami entity being sacrificed
   * @param accID The account performing the sacrifice
   * @return commitID The commit entity ID for later reveal
   */
  function commit(
    IWorld world,
    IUintComp components,
    uint256 kamiID,
    uint256 accID
  ) internal returns (uint256 commitID) {
    // Increment pity counter and get the new count
    uint256 pityCount = incrementPity(components, accID);

    // Determine which droptable to use based on pity
    uint256 dtID = getDroptableID(pityCount);

    // Create the commit entity
    commitID = LibCommit.commit(world, components, accID, block.number, "KAMI_SACRIFICE_COMMIT");

    // Store the droptable ID for reveal
    IdSourceComponent(getAddrByID(components, IdSourceCompID)).set(commitID, dtID);

    // Store the kami ID being sacrificed (for logging/events)
    ValueComponent(getAddrByID(components, ValueCompID)).set(commitID, kamiID);

    // Burn the kami: transfer 721 to burn address and update ECS state
    burn(components, kamiID);

    // Log the sacrifice
    logSacrifice(components, accID, kamiID, pityCount, dtID);
  }

  /////////////////
  // BURN

  /**
   * @notice Burns a kami by transferring its 721 to the burn address and updating ECS state
   * @param components Component registry
   * @param kamiID The kami entity ID to burn
   */
  function burn(IUintComp components, uint256 kamiID) internal {
    // Get the kami's token index (ERC721 tokenID)
    uint32 kamiIndex = LibKami.getIndex(components, kamiID);

    // Transfer the 721 token to the burn address
    LibKami721.unstake(components, BURN_ADDRESS, kamiIndex);

    // Update ECS state: set state to DEAD, health to 0
    LibKami.kill(components, kamiID);

    // Clear ownership so kami no longer appears in party
    IDOwnsKamiComponent(getAddrByID(components, IDOwnsKamiCompID)).set(kamiID, 0);
  }

  /////////////////
  // REVEAL

  /**
   * @notice Reveals and distributes sacrifice rewards
   * @param world The world contract
   * @param components Component registry
   * @param commitIDs Array of commit entity IDs to reveal
   */
  function reveal(IWorld world, IUintComp components, uint256[] memory commitIDs) internal {
    for (uint256 i; i < commitIDs.length; i++) {
      if (commitIDs[i] == 0) continue;
      _revealSingle(world, components, commitIDs[i]);
    }
  }

  /**
   * @notice Reveals and distributes a single sacrifice commit
   * @dev Helper function to avoid stack too deep errors
   */
  function _revealSingle(IWorld world, IUintComp components, uint256 commitID) internal {
    IdSourceComponent idSourceComp = IdSourceComponent(getAddrByID(components, IdSourceCompID));
    IdHolderComponent holderComp = IdHolderComponent(getAddrByID(components, IdHolderCompID));

    uint256 dtID = idSourceComp.extract(commitID);
    uint256 holderID = holderComp.extract(commitID);

    // Extract the sacrificed kami ID for event emission
    uint256 kamiID = ValueComponent(getAddrByID(components, ValueCompID)).extract(commitID);

    BlockRevComponent blockComp = BlockRevComponent(getAddrByID(components, BlockRevealCompID));
    WeightsComponent weightsComp = WeightsComponent(getAddrByID(components, WeightsCompID));

    // Select reward from droptable (always 1 item per sacrifice)
    uint256[] memory amts = _select(blockComp, weightsComp, dtID, commitID);

    KeysComponent keysComp = KeysComponent(getAddrByID(components, KeysCompID));
    uint32[] memory indices = keysComp.get(dtID);

    // Distribute rewards
    _distribute(components, indices, amts, holderID);

    // Emit event
    emitRevealEvent(world, commitID, holderID, kamiID, dtID, indices, amts);

    // Log latest result
    ValuesComponent logComp = ValuesComponent(getAddrByID(components, ValuesCompID));
    TimeComponent timeComp = TimeComponent(getAddrByID(components, TimeCompID));
    logLatest(timeComp, logComp, holderID, dtID, amts);
  }

  /**
   * @notice Selects a single droptable result
   * @dev Uses weighted random selection
   */
  function _select(
    BlockRevComponent blockComp,
    WeightsComponent weightsComp,
    uint256 dtID,
    uint256 commitID
  ) internal returns (uint256[] memory) {
    uint256[] memory weights = weightsComp.get(dtID);
    LibRandom.processWeightedRarityInPlace(weights);
    uint256 seed = LibCommit.extractSeedDirect(blockComp, commitID);

    // Always select 1 item per sacrifice
    return LibRandom.selectMultipleFromWeighted(weights, seed, 1);
  }

  /**
   * @notice Distributes item(s) to holder
   */
  function _distribute(
    IUintComp components,
    uint32[] memory indices,
    uint256[] memory amts,
    uint256 holderID
  ) internal {
    for (uint256 i; i < indices.length; i++) {
      if (amts[i] > 0) {
        LibInventory.incFor(components, holderID, indices[i], amts[i]);
        logTotal(components, holderID, indices[i], amts[i]);
      }
    }
  }

  /////////////////
  // PITY SYSTEM

  /**
   * @notice Increments the pity counter for an account
   * @return The new pity count after incrementing
   */
  function incrementPity(IUintComp components, uint256 accID) internal returns (uint256) {
    uint256 pityID = genPityID(accID);
    ValueComponent valComp = ValueComponent(getAddrByID(components, ValueCompID));
    uint256 current = valComp.safeGet(pityID);
    uint256 newCount = current + 1;
    valComp.set(pityID, newCount);
    return newCount;
  }

  /**
   * @notice Gets the current pity count for an account
   */
  function getPityCount(IUintComp components, uint256 accID) internal view returns (uint256) {
    return ValueComponent(getAddrByID(components, ValueCompID)).safeGet(genPityID(accID));
  }

  /**
   * @notice Determines which droptable to use based on pity count
   * @dev Rare pity (100) takes precedence over uncommon pity (20)
   */
  function getDroptableID(uint256 pityCount) internal pure returns (uint256) {
    if (pityCount % RARE_PITY_THRESHOLD == 0) {
      return SACRIFICE_DT_RARE_PITY;
    } else if (pityCount % UNCOMMON_PITY_THRESHOLD == 0) {
      return SACRIFICE_DT_UNCOMMON_PITY;
    } else {
      return SACRIFICE_DT_NORMAL;
    }
  }

  /**
   * @notice Checks if the count triggers a rare pity
   */
  function isRarePity(uint256 count) internal pure returns (bool) {
    return count > 0 && count % RARE_PITY_THRESHOLD == 0;
  }

  /**
   * @notice Checks if the count triggers an uncommon pity (but not rare)
   */
  function isUncommonPity(uint256 count) internal pure returns (bool) {
    return count > 0 && count % UNCOMMON_PITY_THRESHOLD == 0 && count % RARE_PITY_THRESHOLD != 0;
  }

  /////////////////
  // CHECKERS

  /**
   * @notice Validates that commit IDs are sacrifice commits
   */
  function checkAndExtractIsCommit(IUintComp components, uint256[] memory ids) internal {
    string[] memory types = LibCommit.extractTypes(components, ids);
    for (uint256 i; i < ids.length; i++) {
      if (!LibString.eq(types[i], "KAMI_SACRIFICE_COMMIT")) revert("not sacrifice commit");
    }
  }

  /////////////////
  // DROPTABLE SETUP

  /**
   * @notice Sets up a sacrifice droptable
   * @param components Component registry
   * @param dtID The droptable entity ID
   * @param keys Array of item indices that can be rewarded
   * @param weights Array of weights for each item (higher = more common)
   */
  function setDroptable(
    IUintComp components,
    uint256 dtID,
    uint32[] memory keys,
    uint256[] memory weights
  ) internal {
    KeysComponent(getAddrByID(components, KeysCompID)).set(dtID, keys);
    WeightsComponent(getAddrByID(components, WeightsCompID)).set(dtID, weights);
  }

  /////////////////
  // LOGGING

  function logSacrifice(
    IUintComp components,
    uint256 accID,
    uint256, /* kamiID */
    uint256, /* pityCount */
    uint256 dtID
  ) internal {
    // Log per-account sacrifice count
    LibData.inc(components, accID, 0, "KAMI_SACRIFICE", 1);
    // Log global sacrifice count
    LibData.inc(components, 0, 0, "KAMI_SACRIFICE_TOTAL", 1);

    // Log pity triggers
    if (dtID == SACRIFICE_DT_RARE_PITY) {
      LibData.inc(components, accID, 0, "SACRIFICE_RARE_PITY", 1);
      LibData.inc(components, 0, 0, "SACRIFICE_RARE_PITY_TOTAL", 1);
    } else if (dtID == SACRIFICE_DT_UNCOMMON_PITY) {
      LibData.inc(components, accID, 0, "SACRIFICE_UNCOMMON_PITY", 1);
      LibData.inc(components, 0, 0, "SACRIFICE_UNCOMMON_PITY_TOTAL", 1);
    }
  }

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

  function logTotal(IUintComp components, uint256 holderID, uint32 index, uint256 amt) internal {
    LibData.inc(components, holderID, index, "SACRIFICE_ITEM_TOTAL", amt);
  }

  /////////////////
  // EVENTS

  struct SacrificeRevealEventData {
    uint256 commitID;
    uint256 holderID;
    uint256 kamiID;
    uint256 dtID;
    uint256 timestamp;
    uint32[] itemIndices;
    uint256[] itemAmounts;
  }

  function emitRevealEvent(
    IWorld world,
    uint256 commitID,
    uint256 holderID,
    uint256 kamiID,
    uint256 dtID,
    uint32[] memory indices,
    uint256[] memory amounts
  ) internal {
    // Filter out zero amounts to reduce event size
    (uint32[] memory filteredIndices, uint256[] memory filteredAmounts) = filterNonZero(indices, amounts);

    SacrificeRevealEventData memory eventData = SacrificeRevealEventData({
      commitID: commitID,
      holderID: holderID,
      kamiID: kamiID,
      dtID: dtID,
      timestamp: block.timestamp,
      itemIndices: filteredIndices,
      itemAmounts: filteredAmounts
    });

    LibEmitter.emitEvent(world, "SACRIFICE_REVEAL", _schema(), _encodeEvent(eventData));
  }

  /**
   * @notice Filters parallel arrays to only include entries where amount > 0
   * @dev Gas-efficient: single pass count + single pass copy
   */
  function filterNonZero(
    uint32[] memory indices,
    uint256[] memory amounts
  ) internal pure returns (uint32[] memory, uint256[] memory) {
    // Count non-zero entries
    uint256 count;
    uint256 len = amounts.length;
    for (uint256 i; i < len; i++) {
      if (amounts[i] > 0) count++;
    }

    // Allocate filtered arrays
    uint32[] memory filteredIndices = new uint32[](count);
    uint256[] memory filteredAmounts = new uint256[](count);

    // Copy non-zero entries
    uint256 j;
    for (uint256 i; i < len; i++) {
      if (amounts[i] > 0) {
        filteredIndices[j] = indices[i];
        filteredAmounts[j] = amounts[i];
        j++;
      }
    }

    return (filteredIndices, filteredAmounts);
  }

  function _schema() internal pure returns (uint8[] memory) {
    uint8[] memory schema = new uint8[](7);
    schema[0] = uint8(LibTypes.SchemaValue.UINT256); // commitID
    schema[1] = uint8(LibTypes.SchemaValue.UINT256); // holderID
    schema[2] = uint8(LibTypes.SchemaValue.UINT256); // kamiID
    schema[3] = uint8(LibTypes.SchemaValue.UINT256); // dtID
    schema[4] = uint8(LibTypes.SchemaValue.UINT256); // timestamp
    schema[5] = uint8(LibTypes.SchemaValue.UINT32_ARRAY); // itemIndices
    schema[6] = uint8(LibTypes.SchemaValue.UINT256_ARRAY); // itemAmounts
    return schema;
  }

  function _encodeEvent(SacrificeRevealEventData memory data) internal pure returns (bytes memory) {
    return abi.encode(
      data.commitID,
      data.holderID,
      data.kamiID,
      data.dtID,
      data.timestamp,
      data.itemIndices,
      data.itemAmounts
    );
  }

  /////////////////
  // IDs

  /**
   * @notice Generates the pity counter entity ID for an account
   */
  function genPityID(uint256 accID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("sacrifice.pity", accID)));
  }

  /**
   * @notice Generates the latest log entity ID for an account + droptable
   */
  function genLatestLogID(uint256 holderID, uint256 dtID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("sacrifice.log", holderID, dtID)));
  }
}
