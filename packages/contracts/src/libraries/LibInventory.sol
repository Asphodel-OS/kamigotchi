// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IdOwnsInventoryComponent as OwnerComponent, ID as OwnerCompID } from "components/IdOwnsInventoryComponent.sol";
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

  /**
   * @notice  Create a new item inventory instance for a specified holder
   * @dev fields like affinity, type and name not saved; refer to registry
   *      assumes no other instance of type exists - (would be overwritten)
   */
  function create(
    IUintComp components,
    uint256 holderID,
    uint32 itemIndex
  ) internal returns (uint256 id) {
    id = genID(holderID, itemIndex);
    BalanceComponent(getAddressById(components, BalanceCompID)).set(id, 0);
    IsInventoryComponent(getAddressById(components, IsInvCompID)).set(id);
    IndexItemComponent(getAddressById(components, IndexItemCompID)).set(id, itemIndex);
    OwnerComponent(getAddressById(components, OwnerCompID)).set(id, holderID);
  }

  /// @notice Delete the inventory instance
  function del(IUintComp components, uint256 id) internal {
    getComponentById(components, BalanceCompID).remove(id);
    getComponentById(components, IsInvCompID).remove(id);
    getComponentById(components, IndexItemCompID).remove(id);
    getComponentById(components, OwnerCompID).remove(id);
  }

  /// @notice Increase a inventory balance by the specified amount
  function inc(IUintComp components, uint256 id, uint256 amt) internal returns (uint256 bal) {
    BalanceComponent comp = BalanceComponent(getAddressById(components, BalanceCompID));
    bal = comp.get(id);
    comp.set(id, bal += amt);
  }

  /// @notice Decrease a inventory balance by the specified amount
  function dec(IUintComp components, uint256 id, uint256 amt) internal returns (uint256 bal) {
    BalanceComponent comp = BalanceComponent(getAddressById(components, BalanceCompID));
    bal = comp.get(id);
    require(bal >= amt, "Inventory: insufficient balance"); // for user error feedback
    comp.set(id, bal -= amt);
  }

  /// @notice sets the balance of an inventory instance
  function set(IUintComp components, uint256 id, uint256 amt) internal {
    BalanceComponent(getAddressById(components, BalanceCompID)).set(id, amt);
  }

  /// @notice Transfer the specified fungible inventory amt from=>to entity
  function transfer(IUintComp components, uint256 fromID, uint256 toID, uint256 amt) internal {
    BalanceComponent comp = BalanceComponent(getAddressById(components, BalanceCompID));

    // removing from
    uint256 fromBal = comp.get(fromID);
    require(fromBal >= amt, "Inventory: insufficient balance");
    comp.set(fromID, fromBal - amt);

    // adding to
    comp.set(toID, comp.get(toID) + amt);
  }

  /////////////////
  // CHECKERS

  function hasBalance(IUintComp components, uint256 id) internal view returns (bool) {
    return BalanceComponent(getAddressById(components, BalanceCompID)).has(id);
  }

  // Check if the associated registry entry has a type
  function hasType(IUintComp components, uint256 id) internal view returns (bool) {
    uint256 registryID = LibRegistryItem.getByInstance(components, id);
    return LibRegistryItem.hasType(components, registryID);
  }

  /////////////////
  // GETTERS

  function getBalanceOf(
    IUintComp components,
    uint256 holderID,
    uint32 itemIndex
  ) internal view returns (uint256) {
    uint256 id = get(components, holderID, itemIndex);
    return id > 0 ? getBalance(components, id) : 0;
  }

  function getBalance(IUintComp components, uint256 id) internal view returns (uint256 balance) {
    return BalanceComponent(getAddressById(components, BalanceCompID)).get(id);
  }

  function getOwner(IUintComp components, uint256 id) internal view returns (uint256) {
    return OwnerComponent(getAddressById(components, OwnerCompID)).get(id);
  }

  function getItemIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).get(id);
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory v) {
    uint256 registryID = LibRegistryItem.getByInstance(components, id);
    return LibRegistryItem.getType(components, registryID);
  }

  /////////////////
  // QUERIES

  /// @notice Get the specified inventory instance.
  function get(
    IUintComp components,
    uint256 holderID,
    uint32 itemIndex
  ) internal view returns (uint256 result) {
    uint256 id = genID(holderID, itemIndex);
    return IsInventoryComponent(getAddressById(components, IsInvCompID)).has(id) ? id : 0;
  }

  /// @notice Get all the inventories belonging to a holder
  function getAllForHolder(
    IUintComp components,
    uint256 holderID
  ) internal view returns (uint256[] memory) {
    return
      LibQuery.getIsWithValue(
        getComponentById(components, OwnerCompID),
        getComponentById(components, IsInvCompID),
        abi.encode(holderID)
      );
  }

  /////////////////
  // UTILS

  function genID(uint256 holderID, uint32 itemIndex) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("inventory.instance", holderID, itemIndex)));
  }

  /////////////////
  // DATA LOGGING

  /// @notice log increase for item total
  function logIncItemTotal(
    IUintComp components,
    uint256 accountID,
    uint32 itemIndex,
    uint256 amt
  ) internal {
    LibDataEntity.inc(components, accountID, itemIndex, "ITEM_TOTAL", amt);
  }
}
