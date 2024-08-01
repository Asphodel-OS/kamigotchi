// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";

import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IsLogComponent, ID as IsLogCompID } from "components/IsLogComponent.sol";
import { IsLootboxComponent, ID as IsLootboxCompID } from "components/IsLootboxComponent.sol";
import { TimeComponent, ID as TimeCompID } from "components/TimeComponent.sol";
import { KeysComponent, ID as KeysCompID } from "components/KeysComponent.sol";
import { WeightsComponent, ID as WeightsCompID } from "components/WeightsComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { ValuesComponent, ID as ValuesCompID } from "components/ValuesComponent.sol";

import { LibArray } from "libraries/utils/LibArray.sol";
import { LibCommit } from "libraries/LibCommit.sol";
import { LibData } from "libraries/LibData.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibRandom } from "libraries/utils/LibRandom.sol";
import { LibItemRegistry } from "libraries/LibItemRegistry.sol";

library LibLootbox {
  /**
   * @notice creates a reveal entity for a lootbox
   *   Lootbox reveal entities are an intemediate step to store pre-reveal data
   *   and are identified by
   *     - type = "LOOTBOX_COMMIT"
   *     - RevealBlock
   **/
  function commit(
    IWorld world,
    IUintComp components,
    uint256 accID,
    uint32 itemIndex,
    uint256 count
  ) internal returns (uint256 id) {
    LibInventory.decFor(components, accID, itemIndex, count); // implicit balance check

    // creating reveal entity
    id = LibCommit.commit(world, components, accID, block.number, "LOOTBOX_COMMIT");
    ValueComponent(getAddressById(components, ValueCompID)).set(id, count);
    IndexItemComponent(getAddressById(components, IndexItemCompID)).set(id, itemIndex);
  }

  /// @notice logs the latest reveal result, overwriting previous values
  /// @dev only one exists per account+lootbox. a crutch for FE to show latest result
  function log(IUintComp components, uint256 accID, uint32 index, uint256[] memory amts) internal {
    uint256 logID = genLogID(accID, index);
    ValuesComponent(getAddressById(components, ValuesCompID)).set(logID, amts);
  }

  function reveal(
    IUintComp components,
    uint256 holderID,
    uint32 boxIndex,
    uint256[] memory revealIDs
  ) internal returns (uint256[] memory) {
    ValueComponent valComp = ValueComponent(getAddressById(components, ValueCompID));
    uint256 regID = LibItemRegistry.getByIndex(components, boxIndex);

    (uint32[] memory keys, uint256[] memory weights) = LibRandom.getDroptable(components, regID);
    uint256[] memory seeds = LibCommit.extractSeeds(components, revealIDs);
    uint256[] memory counts = valComp.extractBatch(revealIDs);

    // uint256[] memory amounts = new uint256[](keys.length);
    uint256[] memory amounts = LibRandom.selectMultipleFromWeighted(weights, seeds[0], counts[0]);
    for (uint256 i = 1; i < revealIDs.length; i++)
      LibArray.add(amounts, LibRandom.selectMultipleFromWeighted(weights, seeds[i], counts[i]));

    distribute(components, holderID, keys, amounts);
    log(components, holderID, boxIndex, amounts);
  }

  /// @notice distributes item(s) to holder
  function distribute(
    IUintComp components,
    uint256 holderID,
    uint32[] memory indices,
    uint256[] memory amounts
  ) internal {
    for (uint256 i; i < indices.length; i++)
      if (amounts[i] > 0) LibInventory.incFor(components, holderID, indices[i], amounts[i]);
  }

  ///////////////////
  // CHECKERS

  function isLootbox(IUintComp components, uint256 id) internal view returns (bool) {
    return IsLootboxComponent(getAddressById(components, IsLootboxCompID)).has(id);
  }

  function extractAreCommits(IUintComp components, uint256[] memory ids) internal returns (bool) {
    for (uint256 i; i < ids.length; i++)
      if (!LibString.eq(LibCommit.extractType(components, ids[i]), "LOOTBOX_COMMIT")) return false;
    return true;
  }

  function isSameHolder(uint256[] memory ids) internal returns (bool) {
    for (uint256 i = 1; i < ids.length; i++) if (ids[i] != ids[0]) return false;
    return true;
  }

  function isSameBox(uint32[] memory arr) internal pure returns (bool) {
    for (uint256 i = 1; i < arr.length; i++) if (arr[i] != arr[0]) return false;
    return true;
  }

  ///////////////////
  // GETTERS

  function extractHolders(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (uint256[] memory) {
    return IdHolderComponent(getAddressById(components, IdHolderCompID)).extractBatch(ids);
  }

  function extractIndices(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (uint32[] memory) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).extractBatch(ids);
  }

  function getHolder(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdHolderComponent(getAddressById(components, IdHolderCompID)).get(id);
  }

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).get(id);
  }

  //////////////////
  // DATA LOGGING

  function logIncOpened(
    IUintComp components,
    uint256 holderID,
    uint32 index,
    uint256 count
  ) internal {
    LibData.inc(components, holderID, index, "LOOTBOX_OPENED", count);
  }

  /////////////////
  // UTILS

  function genLogID(uint256 accID, uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("lootbox.log", accID, index)));
  }
}
