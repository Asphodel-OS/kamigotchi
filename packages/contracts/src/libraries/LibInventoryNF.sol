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
import { IsNonFungibleComponent, ID as IsNonFungCompID } from "components/IsNonFungibleComponent.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";
import { LibStat } from "libraries/LibStat.sol";

// handles nonfungible inventory instances
library LibInventoryNF {
  /////////////////
  // INTERACTIONS

  // Create a new non-fungible (item) inventory instance with a specified holder and item instance.
  // NOTE: we don't save fields like affinity, class, type and name since they're consistent
  // between instances. We could consider adding them for ease of access.
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

    uint256 registryID = LibRegistryItem.getByItemIndex(components, itemIndex);
    LibStat.copy(components, registryID, id);
    return id;
  }

  // Delete the inventory instance
  function del(IUintComp components, uint256 id) internal {
    getComponentById(components, IsInvCompID).remove(id);
    getComponentById(components, IsNonFungCompID).remove(id);
    getComponentById(components, IdHolderCompID).remove(id);
    getComponentById(components, IndexItemCompID).remove(id);
    LibStat.wipe(components, id);
  }

  // Transfer the specified NF inventory instance by updating the holder
  function transfer(IUintComp components, uint256 id, uint256 newHolderID) internal {
    IdHolderComponent(getAddressById(components, IdHolderCompID)).set(id, newHolderID);
  }

  /////////////////
  // CHECKERS

  // Check if the specified entity is a non-fungible inventory instance
  function isInstance(IUintComp components, uint256 id) internal view returns (bool) {
    uint registryID = LibRegistryItem.getEntry(components, id);
    return
      IsInventoryComponent(getAddressById(components, IsInvCompID)).has(id) &&
      LibRegistryItem.isNonFungible(components, registryID);
  }

  // Check if the associated registry entry has a name
  function hasName(IUintComp components, uint256 id) internal view returns (bool) {
    uint256 registryID = LibRegistryItem.getEntry(components, id);
    return LibRegistryItem.hasName(components, registryID);
  }

  // Check if the associated registry entry has a type
  function hasType(IUintComp components, uint256 id) internal view returns (bool) {
    uint256 registryID = LibRegistryItem.getEntry(components, id);
    return LibRegistryItem.hasType(components, registryID);
  }

  /////////////////
  // GETTERS

  function getItemIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).getValue(id);
  }

  function getHolder(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdHolderComponent(getAddressById(components, IdHolderCompID)).getValue(id);
  }

  // Get the name from the registry entry if it exists.
  function getName(IUintComp components, uint256 id) internal view returns (string memory v) {
    if (hasName(components, id)) {
      uint256 registryID = LibRegistryItem.getEntry(components, id);
      v = LibRegistryItem.getName(components, registryID);
    }
  }

  // Get the type from the registry entry if it exists.
  function getType(IUintComp components, uint256 id) internal view returns (string memory v) {
    if (hasType(components, id)) {
      uint256 registryID = LibRegistryItem.getEntry(components, id);
      v = LibRegistryItem.getType(components, registryID);
    }
  }

  /////////////////
  // QUERIES

  // Get the specified inventory instance.
  // NOTE: not so useful as we can't just assume a single instances
  function get(
    IUintComp components,
    uint256 holderID,
    uint256 itemIndex
  ) internal view returns (uint256 result) {
    uint256[] memory results = _getAllX(components, holderID, itemIndex);
    if (results.length > 0) result = results[0];
  }

  function getAllForHolder(
    IUintComp components,
    uint256 holderID
  ) internal view returns (uint256[] memory) {
    return _getAllX(components, holderID, 0);
  }

  // Get all non-fungible(item) inventory entities matching filters. 0 values indicate no filter.
  function _getAllX(
    IUintComp components,
    uint256 holderID,
    uint256 itemIndex
  ) internal view returns (uint256[] memory) {
    uint256 setFilters; // number of optional non-zero filters
    if (holderID != 0) setFilters++;
    if (itemIndex != 0) setFilters++;

    uint256 filterCount = 1; // number of mandatory filters
    QueryFragment[] memory fragments = new QueryFragment[](setFilters + filterCount);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsInvCompID), "");

    if (holderID != 0) {
      fragments[filterCount++] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IdHolderCompID),
        abi.encode(holderID)
      );
    }
    if (itemIndex != 0) {
      fragments[filterCount++] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IndexItemCompID),
        abi.encode(itemIndex)
      );
    }

    return LibQuery.query(fragments);
  }
}
