// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IsInventoryComponent, ID as IsInvCompID } from "components/IsInventoryComponent.sol";
import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";

import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";
import { LibStat } from "libraries/LibStat.sol";

// handles nonfungible inventory instances
library LibInventory {
  /////////////////
  // INTERACTIONS

  // Create a new item inventory instance for a specified holder. The shape depends on
  // whether the reference item is fungible or not as determined by its registry entry.
  // NOTE: we don't save fields like affinity, class, type and name since they're
  // consistent between instances. We could consider adding them for ease of access.
  function create(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint256 itemIndex
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsInventoryComponent(getAddressById(components, IsInvCompID)).set(id);
    IdHolderComponent(getAddressById(components, IdHolderCompID)).set(id, holderID);
    IndexItemComponent(getAddressById(components, IndexItemCompID)).set(id, itemIndex);

    // copy or create the appropriate fields depending on whether this item is fungible
    uint registryID = LibRegistryItem.getByItemIndex(components, itemIndex);
    if (LibRegistryItem.isFungible(components, registryID)) {
      BalanceComponent(getAddressById(components, BalanceCompID)).set(id, 0);
    } else {
      LibStat.copy(components, registryID, id);
    }
    return id;
  }

  // create an inventory instance based on food index
  function createFood(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint256 foodIndex
  ) internal returns (uint256) {
    uint256 registryID = LibRegistryItem.getByFoodIndex(components, foodIndex);
    uint256 itemIndex = LibRegistryItem.getItemIndex(components, registryID);
    return create(world, components, holderID, itemIndex);
  }

  // create an inventory instance based on revive index
  function createRevive(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint256 reviveIndex
  ) internal returns (uint256) {
    uint256 registryID = LibRegistryItem.getByReviveIndex(components, reviveIndex);
    uint256 itemIndex = LibRegistryItem.getItemIndex(components, registryID);
    return create(world, components, holderID, itemIndex);
  }

  // create an inventory instance based on mod index
  function createMod(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint256 modIndex
  ) internal returns (uint256) {
    uint256 registryID = LibRegistryItem.getByModIndex(components, modIndex);
    uint256 itemIndex = LibRegistryItem.getItemIndex(components, registryID);
    return create(world, components, holderID, itemIndex);
  }

  // create an inventory instance based on gear index
  function createGear(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint256 gearIndex
  ) internal returns (uint256) {
    uint256 registryID = LibRegistryItem.getByGearIndex(components, gearIndex);
    uint256 itemIndex = LibRegistryItem.getItemIndex(components, registryID);
    return create(world, components, holderID, itemIndex);
  }

  // Delete the inventory instance
  function del(IUintComp components, uint256 id) internal {
    getComponentById(components, IsInvCompID).remove(id);
    getComponentById(components, IdHolderCompID).remove(id);
    getComponentById(components, IndexItemCompID).remove(id);

    // remove the appropriate fields depending on whether this item is fungible
    uint registryID = LibRegistryItem.getByInstance(components, id);
    if (LibRegistryItem.isFungible(components, registryID)) {
      removeBalance(components, id);
    } else {
      LibStat.wipe(components, id);
    }
  }

  // Increase a fungible inventory balance by the specified amount
  function inc(IUintComp components, uint256 id, uint256 amt) internal returns (uint256) {
    uint256 bal = getBalance(components, id);
    bal += amt;
    setBalance(components, id, bal); // implicit check for fungible
    return bal;
  }

  // Decrease a fungible inventory balance by the specified amount
  // NOTE: this does not clear out 0 balance inventories
  function dec(IUintComp components, uint256 id, uint256 amt) internal returns (uint256) {
    uint256 bal = getBalance(components, id);
    require(bal >= amt, "Inventory: insufficient balance");
    bal -= amt;
    setBalance(components, id, bal); // implicit check for fungible
    return bal;
  }

  // Transfer the specified NF inventory instance by updating the holder
  // TODO: implement generalized transfer function
  function transfer(IUintComp components, uint256 id, uint256 toID) internal {
    IdHolderComponent(getAddressById(components, IdHolderCompID)).set(id, toID);
  }

  // Transfer the specified fungible inventory amt from=>to entity
  // TODO: implement generalized transfer function
  function transfer(IUintComp components, uint256 fromID, uint256 toID, uint256 amt) internal {
    dec(components, fromID, amt);
    inc(components, toID, amt);
  }

  /////////////////
  // CHECKERS

  // Check if the specified entity is a fungible inventory instance
  function isInstanceFungible(IUintComp components, uint256 id) internal view returns (bool) {
    uint registryID = LibRegistryItem.getByInstance(components, id);
    return
      IsInventoryComponent(getAddressById(components, IsInvCompID)).has(id) &&
      LibRegistryItem.isFungible(components, registryID);
  }

  // Check if the specified entity is a non-fungible inventory instance
  function isInstanceNonFungible(IUintComp components, uint256 id) internal view returns (bool) {
    uint registryID = LibRegistryItem.getByInstance(components, id);
    return
      IsInventoryComponent(getAddressById(components, IsInvCompID)).has(id) &&
      LibRegistryItem.isNonFungible(components, registryID);
  }

  function hasBalance(IUintComp components, uint256 id) internal view returns (bool) {
    return BalanceComponent(getAddressById(components, BalanceCompID)).has(id);
  }

  // Check if the associated registry entry has a name
  function hasName(IUintComp components, uint256 id) internal view returns (bool) {
    uint256 registryID = LibRegistryItem.getByInstance(components, id);
    return LibRegistryItem.hasName(components, registryID);
  }

  // Check if the associated registry entry has a type
  function hasType(IUintComp components, uint256 id) internal view returns (bool) {
    uint256 registryID = LibRegistryItem.getByInstance(components, id);
    return LibRegistryItem.hasType(components, registryID);
  }

  /////////////////
  // SETTERS

  // Set the balance of an existing fungible inventory entity
  function setBalance(IUintComp components, uint256 id, uint256 amt) internal {
    require(
      isInstanceFungible(components, id),
      "LibInventory.setBalance(): not a fungible inventory instance"
    );
    BalanceComponent(getAddressById(components, BalanceCompID)).set(id, amt);
  }

  // Remove the balance field if it's present
  function removeBalance(IUintComp components, uint256 id) internal {
    if (hasBalance(components, id)) {
      getComponentById(components, BalanceCompID).remove(id);
    }
  }

  /////////////////
  // GETTERS

  // get the balance of a fungible inventory instance. return 0 if non-fungible or if none exists
  function getBalance(IUintComp components, uint256 id) internal view returns (uint256 balance) {
    BalanceComponent comp = BalanceComponent(getAddressById(components, BalanceCompID));
    if (comp.has(id)) {
      balance = comp.getValue(id);
    }
  }

  function getHolder(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdHolderComponent(getAddressById(components, IdHolderCompID)).getValue(id);
  }

  function getItemIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).getValue(id);
  }

  // Get the name from the registry entry if it exists.
  function getName(IUintComp components, uint256 id) internal view returns (string memory v) {
    if (hasName(components, id)) {
      uint256 registryID = LibRegistryItem.getByInstance(components, id);
      v = LibRegistryItem.getName(components, registryID);
    }
  }

  // Get the type from the registry entry if it exists.
  function getType(IUintComp components, uint256 id) internal view returns (string memory v) {
    if (hasType(components, id)) {
      uint256 registryID = LibRegistryItem.getByInstance(components, id);
      v = LibRegistryItem.getType(components, registryID);
    }
  }

  /////////////////
  // QUERIES

  // Get the specified inventory instance.
  function get(
    IUintComp components,
    uint256 holderID,
    uint256 itemIndex
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsInvCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdHolderCompID),
      abi.encode(holderID)
    );
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexItemCompID),
      abi.encode(itemIndex)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length > 0) result = results[0];
  }

  // Get a food inventory instance for a holder, based on the food index
  function getFood(
    IUintComp components,
    uint256 holderID,
    uint256 foodIndex
  ) internal view returns (uint256) {
    uint256 registryID = LibRegistryItem.getByFoodIndex(components, foodIndex);
    uint256 itemIndex = LibRegistryItem.getItemIndex(components, registryID);
    return get(components, holderID, itemIndex);
  }

  // Get a revive inventory instance for a holder, based on the revive index
  function getRevive(
    IUintComp components,
    uint256 holderID,
    uint256 reviveIndex
  ) internal view returns (uint256) {
    uint256 registryID = LibRegistryItem.getByReviveIndex(components, reviveIndex);
    uint256 itemIndex = LibRegistryItem.getItemIndex(components, registryID);
    return get(components, holderID, itemIndex);
  }

  // Get a mod inventory instance for a holder, based on the mod index
  function getMod(
    IUintComp components,
    uint256 holderID,
    uint256 modIndex
  ) internal view returns (uint256) {
    uint256 registryID = LibRegistryItem.getByModIndex(components, modIndex);
    uint256 itemIndex = LibRegistryItem.getItemIndex(components, registryID);
    return get(components, holderID, itemIndex);
  }

  // Get a gear inventory instance for a holder, based on the gear index
  function getGear(
    IUintComp components,
    uint256 holderID,
    uint256 gearIndex
  ) internal view returns (uint256) {
    uint256 registryID = LibRegistryItem.getByGearIndex(components, gearIndex);
    uint256 itemIndex = LibRegistryItem.getItemIndex(components, registryID);
    return get(components, holderID, itemIndex);
  }

  // Get all the inventories belonging to a holder
  function getAllForHolder(
    IUintComp components,
    uint256 holderID
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsInvCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdHolderCompID),
      abi.encode(holderID)
    );

    return LibQuery.query(fragments);
  }

  /////////////////
  // DATA LOGGING

  // @notice log increase for item total
  function logIncItemTotal(
    IWorld world,
    IUintComp components,
    uint256 accountID,
    uint256 itemIndex,
    uint256 amt
  ) internal {
    LibDataEntity.incFor(world, components, accountID, itemIndex, "ITEM_TOTAL", amt);
  }
}
