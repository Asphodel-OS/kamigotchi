// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";

import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IsLootboxComponent, ID as IsLootboxCompID } from "components/IsLootboxComponent.sol";
import { KeysComponent, ID as KeysCompID } from "components/KeysComponent.sol";
import { WeightsComponent, ID as WeightsCompID } from "components/WeightsComponent.sol";

import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibRandom } from "libraries/LibRandom.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";

library LibLootbox {
  /*
   * @notice creates a reveal entity for a lootbox
   *   Lootbox reveal entities are an intemediate step to store pre-reveal data
   *   and are identified by
   *     - IsLootbox
   *     - RevealBlock
   **/
  // @param world       The world contract
  // @param components  The components contract
  // @param invID       EntityID of the lootbox inventory
  // @param amt         The amount of items to reveal
  function startReveal(
    IWorld world,
    IUintComp components,
    uint256 invID,
    uint256 amt
  ) internal returns (uint256 id) {
    // @dev extra check to make sure the item is a lootbox
    uint256 regID = LibRegistryItem.getByInstance(components, invID);
    require(isLootbox(components, regID), "LibLootbox: inv not lootbox");

    LibInventory.dec(components, invID, amt);

    // creating reveal entity
    id = world.getUniqueEntityId();
    setIsLootbox(components, id);
    setBalance(components, id, amt);
    setHolder(components, id, LibInventory.getHolder(components, invID));
    setIndex(components, id, LibInventory.getItemIndex(components, invID));
    LibRandom.setRevealBlock(components, id, block.number);
  }

  // @notice executes a reveal for a lootbox
  // @param components  The components contract
  // @param revealID    The entity ID of the lootbox reveal
  function executeReveal(
    IWorld world,
    IUintComp components,
    uint256 revealID,
    uint256 holderID
  ) internal {
    require(
      isLootbox(components, revealID) && LibRandom.hasRevealBlock(components, revealID),
      "LibLootbox: not reveal entity"
    );

    // scoping to save memory
    {
      uint256 index = getIndex(components, revealID);
      uint256 amt = getBalance(components, revealID);
      uint256 regID = LibRegistryItem.getByItemIndex(components, index);
      uint256[] memory keys = getKeys(components, regID);
      uint256[] memory weights = getWeights(components, regID);
      uint256 seed = uint256(
        keccak256(
          abi.encode(
            LibRandom.getSeedBlockhash(LibRandom.getRevealBlock(components, revealID)),
            holderID
          )
        )
      );

      executeDropTable(world, components, holderID, keys, weights, seed, amt);
    }
  }

  // @notice executes drop table logic for N lootboxes
  // @param world      The world contract
  // @param components The components contract
  // @param holderID  The entity ID of the lootbox holder
  // @param weights   Weights for lootbox drop table
  // @param keys      Keys for lootbox drop table
  // @param amt       The amount of lootboxes to open
  function executeDropTable(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint256[] memory keys,
    uint256[] memory weights,
    uint256 seed,
    uint256 amt
  ) internal {
    if (amt == 1) {
      uint256 index = LibRandom.selectFromWeighted(keys, weights, seed);
      distribute(world, components, holderID, index, 1);
    } else {
      uint256[] memory results = LibRandom.selectMultipleFromWeighted(keys, weights, seed, amt);
      for (uint256 i; i < results.length; i++) {
        distribute(world, components, holderID, keys[i], results[i]);
      }
    }
  }

  // @notice distributes item(s) to holder
  // @param world      The world contract
  // @param components The components contract
  // @param holderID  The entityID of the holder
  // @param index     The index of the item to distribute
  // @param amt       The amount of items to distribute
  function distribute(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint256 index,
    uint256 amt
  ) internal {
    if (amt == 0) return;

    uint256 invID = LibInventory.get(components, holderID, index);
    if (invID == 0) {
      invID = LibInventory.create(world, components, holderID, index);
    }
    LibInventory.inc(components, invID, amt);
  }

  // @notice deletes a reveal entity
  // @param components  The components contract
  // @param id          entityID
  function deleteReveal(IUintComp components, uint256 id) internal {
    unsetIsLootbox(components, id);
    unsetBalance(components, id);
    unsetHolder(components, id);
    unsetIndex(components, id);
    LibRandom.removeRevealBlock(components, id);
  }

  ///////////////////
  // GETTERS

  function isLootbox(IUintComp components, uint256 id) internal view returns (bool) {
    return IsLootboxComponent(getAddressById(components, IsLootboxCompID)).has(id);
  }

  function getBalance(IUintComp components, uint256 id) internal view returns (uint256) {
    return BalanceComponent(getAddressById(components, BalanceCompID)).getValue(id);
  }

  function getHolder(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdHolderComponent(getAddressById(components, IdHolderCompID)).getValue(id);
  }

  function getIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).getValue(id);
  }

  function getKeys(IUintComp components, uint256 id) internal view returns (uint256[] memory) {
    return KeysComponent(getAddressById(components, KeysCompID)).getValue(id);
  }

  function getWeights(IUintComp components, uint256 id) internal view returns (uint256[] memory) {
    return WeightsComponent(getAddressById(components, WeightsCompID)).getValue(id);
  }

  //////////////////
  // SETTERS

  function setBalance(IUintComp components, uint256 id, uint256 balance) internal {
    BalanceComponent(getAddressById(components, BalanceCompID)).set(id, balance);
  }

  function setHolder(IUintComp components, uint256 id, uint256 holderID) internal {
    IdHolderComponent(getAddressById(components, IdHolderCompID)).set(id, holderID);
  }

  function setIndex(IUintComp components, uint256 id, uint256 index) internal {
    IndexItemComponent(getAddressById(components, IndexItemCompID)).set(id, index);
  }

  function setIsLootbox(IUintComp components, uint256 id) internal {
    IsLootboxComponent(getAddressById(components, IsLootboxCompID)).set(id);
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
    uint256 index,
    uint256 amt
  ) internal {
    LibDataEntity.incFor(world, components, holderID, index, "LOOTBOX_OPENED", amt);
  }
}
