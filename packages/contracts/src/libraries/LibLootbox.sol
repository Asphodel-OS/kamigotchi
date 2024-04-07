// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";

import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { BalancesComponent, ID as BalancesCompID } from "components/BalancesComponent.sol";
import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IsLogComponent, ID as IsLogCompID } from "components/IsLogComponent.sol";
import { IsLootboxComponent, ID as IsLootboxCompID } from "components/IsLootboxComponent.sol";
import { TimeComponent, ID as TimeCompID } from "components/TimeComponent.sol";
import { KeysComponent, ID as KeysCompID } from "components/KeysComponent.sol";
import { WeightsComponent, ID as WeightsCompID } from "components/WeightsComponent.sol";

import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibRandom } from "libraries/utils/LibRandom.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";

library LibLootbox {
  /**
   * @notice creates a reveal entity for a lootbox
   *   Lootbox reveal entities are an intemediate step to store pre-reveal data
   *   and are identified by
   *     - IsLootbox
   *     - RevealBlock
   **/
  /// @param world       The world contract
  /// @param components  The components contract
  /// @param invID       EntityID of the lootbox inventory
  /// @param count       The amount of items to reveal
  function startReveal(
    IWorld world,
    IUintComp components,
    uint256 invID,
    uint256 count
  ) internal returns (uint256 id) {
    LibInventory.dec(components, invID, count);

    // creating reveal entity
    id = world.getUniqueEntityId();
    setIsLootbox(components, id);
    setIsLog(components, id);
    setBalance(components, id, count);
    setHolder(components, id, LibInventory.getOwner(components, invID));
    setIndex(components, id, LibInventory.getItemIndex(components, invID));
    LibRandom.setRevealBlock(components, id, block.number);
  }

  /** @notice
   * executes a reveal for a lootbox, leaving a result log
   * result logs are identified by
   *   - IsLootbox
   *   - IsLog
   */
  /// @param components  The components contract
  /// @param revealID    The entity ID of the lootbox reveal
  function executeReveal(
    IWorld world,
    IUintComp components,
    uint256 revealID,
    uint256 holderID
  ) internal {
    uint256 count = getBalance(components, revealID);
    uint256 regID = LibRegistryItem.getByIndex(components, getIndex(components, revealID));
    uint32[] memory keys = getKeys(components, regID);
    uint256[] memory weights = getWeights(components, regID);
    uint256 seed = uint256(
      keccak256(
        abi.encode(
          LibRandom.getSeedBlockhash(LibRandom.getRevealBlock(components, revealID)),
          holderID
        )
      )
    );

    uint256[] memory results = LibRandom.selectMultipleFromWeighted(weights, seed, count);
    for (uint256 i; i < results.length; i++) {
      distribute(world, components, holderID, keys[i], results[i]);
    }

    logReveal(components, revealID, results);
  }

  /// @notice distributes item(s) to holder
  /// @param world      The world contract
  /// @param components The components contract
  /// @param holderID  The entityID of the holder
  /// @param index     The index of the item to distribute
  /// @param count       The amount of items to distribute
  function distribute(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint32 index,
    uint256 count
  ) internal {
    if (count == 0) return;

    uint256 invID = LibInventory.get(components, holderID, index);
    if (invID == 0) {
      invID = LibInventory.create(components, holderID, index);
    }
    LibInventory.inc(components, invID, count);
  }

  /// @notice logs the reveal result, deleting unessary fields
  /// @param components The components contract
  /// @param id         The entityID of the lootbox reveal
  /// @param amounts    resultant amounts
  function logReveal(IUintComp components, uint256 id, uint256[] memory amounts) internal {
    setBalances(components, id, amounts);
    setTime(components, id, block.timestamp);

    LibRandom.removeRevealBlock(components, id);
  }

  ///////////////////
  // GETTERS

  function isLootbox(IUintComp components, uint256 id) internal view returns (bool) {
    return IsLootboxComponent(getAddressById(components, IsLootboxCompID)).has(id);
  }

  function getBalance(IUintComp components, uint256 id) internal view returns (uint256) {
    return BalanceComponent(getAddressById(components, BalanceCompID)).get(id);
  }

  function getHolder(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdHolderComponent(getAddressById(components, IdHolderCompID)).get(id);
  }

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).get(id);
  }

  function getKeys(IUintComp components, uint256 id) internal view returns (uint32[] memory) {
    return KeysComponent(getAddressById(components, KeysCompID)).get(id);
  }

  function getWeights(IUintComp components, uint256 id) internal view returns (uint256[] memory) {
    return WeightsComponent(getAddressById(components, WeightsCompID)).get(id);
  }

  //////////////////
  // SETTERS

  function setBalance(IUintComp components, uint256 id, uint256 balance) internal {
    BalanceComponent(getAddressById(components, BalanceCompID)).set(id, balance);
  }

  function setBalances(IUintComp components, uint256 id, uint256[] memory balances) internal {
    BalancesComponent(getAddressById(components, BalancesCompID)).set(id, balances);
  }

  function setHolder(IUintComp components, uint256 id, uint256 holderID) internal {
    IdHolderComponent(getAddressById(components, IdHolderCompID)).set(id, holderID);
  }

  function setIndex(IUintComp components, uint256 id, uint32 index) internal {
    IndexItemComponent(getAddressById(components, IndexItemCompID)).set(id, index);
  }

  function setIsLog(IUintComp components, uint256 id) internal {
    IsLogComponent(getAddressById(components, IsLogCompID)).set(id);
  }

  function setIsLootbox(IUintComp components, uint256 id) internal {
    IsLootboxComponent(getAddressById(components, IsLootboxCompID)).set(id);
  }

  function setTime(IUintComp components, uint256 id, uint256 time) internal {
    TimeComponent(getAddressById(components, TimeCompID)).set(id, time);
  }

  function unsetBalance(IUintComp components, uint256 id) internal {
    BalanceComponent(getAddressById(components, BalanceCompID)).remove(id);
  }

  function unsetHolder(IUintComp components, uint256 id) internal {
    IdHolderComponent(getAddressById(components, IdHolderCompID)).remove(id);
  }

  function unsetIndex(IUintComp components, uint256 id) internal {
    IndexItemComponent(getAddressById(components, IndexItemCompID)).remove(id);
  }

  function unsetIsLootbox(IUintComp components, uint256 id) internal {
    IsLootboxComponent(getAddressById(components, IsLootboxCompID)).remove(id);
  }

  //////////////////
  // DATA LOGGING

  function logIncOpened(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint32 index,
    uint256 count
  ) internal {
    LibDataEntity.inc(components, holderID, index, "LOOTBOX_OPENED", count);
  }
}
