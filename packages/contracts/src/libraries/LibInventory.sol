// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IDOwnsInventoryComponent as OwnerComponent, ID as OwnerCompID } from "components/IDOwnsInventoryComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IsInventoryComponent as IsInvComponent, ID as IsInvCompID } from "components/IsInventoryComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibData } from "libraries/LibData.sol";
import { LibItemRegistry } from "libraries/LibItemRegistry.sol";
import { LibStat } from "libraries/LibStat.sol";

////////////////////
// CONSTANTS

uint32 constant MUSU_INDEX = 1;

// handles nonfungible inventory instances
library LibInventory {
  using LibComp for ValueComponent;

  /////////////////
  // SHAPES

  /**
   * @notice  Create a new item inventory instance for a specified holder
   * @dev fields like affinity, type and name not saved; refer to registry
   *      assumes no other instance of type exists - (would be overwritten)
   */
  function create(
    IUintComp components,
    uint256 id,
    uint256 holderID,
    uint32 itemIndex
  ) internal returns (uint256) {
    IsInvComponent(getAddressById(components, IsInvCompID)).set(id);
    IndexItemComponent(getAddressById(components, IndexItemCompID)).set(id, itemIndex);
    OwnerComponent(getAddressById(components, OwnerCompID)).set(id, holderID);
    ValueComponent(getAddressById(components, ValueCompID)).set(id, 0);
  }

  function create(
    IUintComp components,
    uint256 holderID,
    uint32 itemIndex
  ) internal returns (uint256 id) {
    id = genID(holderID, itemIndex);
    create(components, id, holderID, itemIndex);
  }

  /// @notice checks if inventory exists, creates otherwise
  /**@dev
   * slightly optimises the `check if exist, else create` pattern
   *   - reduces 2 reads and 1 hash
   */
  function createFor(
    IUintComp components,
    uint256 holderID,
    uint32 itemIndex
  ) internal returns (uint256 id) {
    id = genID(holderID, itemIndex);
    IsInvComponent isComp = IsInvComponent(getAddressById(components, IsInvCompID));
    if (!isComp.has(id)) {
      isComp.set(id);
      IndexItemComponent(getAddressById(components, IndexItemCompID)).set(id, itemIndex);
      OwnerComponent(getAddressById(components, OwnerCompID)).set(id, holderID);
    }
  }

  function createForBatch(
    IUintComp components,
    uint256 holderID,
    uint32[] memory itemIndices
  ) internal returns (uint256[] memory) {
    uint256[] memory ids = new uint256[](itemIndices.length);
    for (uint256 i; i < itemIndices.length; i++) ids[i] = genID(holderID, itemIndices[i]);

    IsInvComponent isComp = IsInvComponent(getAddressById(components, IsInvCompID));
    (bool[] memory haveIDs, bool allExist) = LibComp.hasBatchWithAggregate(isComp, ids);
    if (allExist) return ids; // all exist, nothing to create

    // create new instances
    IndexItemComponent indexComp = IndexItemComponent(getAddressById(components, IndexItemCompID));
    OwnerComponent ownerComp = OwnerComponent(getAddressById(components, OwnerCompID));
    for (uint256 i; i < itemIndices.length; i++) {
      uint256 id = ids[i];
      if (!haveIDs[i]) {
        isComp.set(id);
        indexComp.set(id, itemIndices[i]);
        ownerComp.set(id, holderID);
      }
    }
    return ids;
  }

  /// @notice Delete the inventory instance
  function del(IUintComp components, uint256 id) internal {
    getComponentById(components, ValueCompID).remove(id);
    getComponentById(components, IsInvCompID).remove(id);
    getComponentById(components, IndexItemCompID).remove(id);
    getComponentById(components, OwnerCompID).remove(id);
  }

  /////////////////
  // INTERACTIONS

  /// @notice increase, and creates new inventory if needed
  function incFor(IUintComp components, uint256 holderID, uint32 itemIndex, uint256 amt) internal {
    uint256 id = createFor(components, holderID, itemIndex);
    ValueComponent(getAddressById(components, ValueCompID)).inc(id, amt);
  }

  function incForBatch(
    IUintComp components,
    uint256 holderID,
    uint32[] memory itemIndices,
    uint256[] memory amts
  ) internal {
    uint256[] memory ids = createForBatch(components, holderID, itemIndices);
    ValueComponent(getAddressById(components, ValueCompID)).incBatch(ids, amts);
  }

  /// @notice decrease, and creates new inventory if needed
  function decFor(IUintComp components, uint256 holderID, uint32 itemIndex, uint256 amt) internal {
    uint256 id = createFor(components, holderID, itemIndex);
    ValueComponent(getAddressById(components, ValueCompID)).dec(id, amt);
  }

  function decForBatch(
    IUintComp components,
    uint256 holderID,
    uint32[] memory itemIndices,
    uint256[] memory amts
  ) internal {
    uint256[] memory ids = createForBatch(components, holderID, itemIndices);
    ValueComponent(getAddressById(components, ValueCompID)).decBatch(ids, amts);
  }

  /// @notice sets, and creates new inventory if needed
  function setFor(IUintComp components, uint256 holderID, uint32 itemIndex, uint256 amt) internal {
    uint256 id = createFor(components, holderID, itemIndex);
    set(components, id, amt);
  }

  /// @notice transfers, and creates new inventory if needed
  /// @dev avoided some component cache optims for readability
  function transferFor(
    IUintComp components,
    uint256 fromHolder,
    uint256 toHolder,
    uint32 itemIndex,
    uint256 amt
  ) internal {
    // raw existence check to cache component
    uint256 fromID = genID(fromHolder, itemIndex);
    uint256 toID = genID(toHolder, itemIndex);
    IsInvComponent isComp = IsInvComponent(getAddressById(components, IsInvCompID));
    if (!isComp.has(fromID)) create(components, fromID, fromHolder, itemIndex);
    if (!isComp.has(toID)) create(components, toID, toHolder, itemIndex);

    transfer(components, fromID, toID, amt);
  }

  /// @notice sets the balance of an inventory instance
  function set(IUintComp components, uint256 id, uint256 amt) internal {
    ValueComponent(getAddressById(components, ValueCompID)).set(id, amt);
  }

  /// @notice Transfer the specified fungible inventory amt from=>to entity
  function transfer(IUintComp components, uint256 fromID, uint256 toID, uint256 amt) internal {
    ValueComponent comp = ValueComponent(getAddressById(components, ValueCompID));

    // removing from
    uint256 fromBal = comp.get(fromID);
    require(fromBal >= amt, "Inventory: insufficient balance");
    comp.set(fromID, fromBal - amt);

    // adding to
    comp.set(toID, comp.get(toID) + amt);
  }

  /////////////////
  // GETTERS

  function getBalanceOf(
    IUintComp components,
    uint256 holderID,
    uint32 itemIndex
  ) internal view returns (uint256) {
    uint256 id = genID(holderID, itemIndex);
    return ValueComponent(getAddressById(components, ValueCompID)).safeGetUint256(id);
  }

  function getBalance(IUintComp components, uint256 id) internal view returns (uint256 balance) {
    return ValueComponent(getAddressById(components, ValueCompID)).get(id);
  }

  function getOwner(IUintComp components, uint256 id) internal view returns (uint256) {
    return OwnerComponent(getAddressById(components, OwnerCompID)).get(id);
  }

  function getItemIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).get(id);
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory v) {
    uint256 registryID = LibItemRegistry.getByInstance(components, id);
    return LibItemRegistry.getType(components, registryID);
  }

  function getTypeByIndex(
    IUintComp components,
    uint32 itemIndex
  ) internal view returns (string memory) {
    // skips registry existence check - its implicitly checked when getting type
    uint256 registryID = LibItemRegistry.genID(itemIndex);
    return LibItemRegistry.getType(components, registryID);
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
    return IsInvComponent(getAddressById(components, IsInvCompID)).has(id) ? id : 0;
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
    uint256 accID,
    uint32 itemIndex,
    uint256 amt
  ) internal {
    LibData.inc(components, accID, itemIndex, "ITEM_TOTAL", amt);
  }
}
