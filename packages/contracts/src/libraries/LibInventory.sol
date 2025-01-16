// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { IDOwnsInventoryComponent as OwnerComponent, ID as OwnerCompID } from "components/IDOwnsInventoryComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";

import { LibData } from "libraries/LibData.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibStat } from "libraries/LibStat.sol";

////////////////////
// CONSTANTS

uint32 constant MUSU_INDEX = 1;
uint32 constant GACHA_TICKET_INDEX = 2;

// handles nonfungible inventory instances
library LibInventory {
  using LibComp for IUintComp;

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
    LibEntityType.set(components, id, "INVENTORY");
    IndexItemComponent(getAddrByID(components, IndexItemCompID)).set(id, itemIndex);
    OwnerComponent(getAddrByID(components, OwnerCompID)).set(id, holderID);
    ValueComponent(getAddrByID(components, ValueCompID)).set(id, 0);
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
    bool has = LibEntityType.checkAndSet(components, id, "INVENTORY");
    if (!has) {
      IndexItemComponent(getAddrByID(components, IndexItemCompID)).set(id, itemIndex);
      OwnerComponent(getAddrByID(components, OwnerCompID)).set(id, holderID);
    }
  }

  function createForBatch(
    IUintComp components,
    uint256 holderID,
    uint32[] memory itemIndices
  ) internal returns (uint256[] memory) {
    uint256[] memory ids = new uint256[](itemIndices.length);
    for (uint256 i; i < itemIndices.length; i++) ids[i] = genID(holderID, itemIndices[i]);

    (bool[] memory haveIDs, bool allExist) = LibEntityType.isShapeBatchWithAggregate(
      components,
      ids,
      "INVENTORY"
    );
    if (allExist) return ids; // all exist, nothing to create

    // create new instances
    IndexItemComponent indexComp = IndexItemComponent(getAddrByID(components, IndexItemCompID));
    OwnerComponent ownerComp = OwnerComponent(getAddrByID(components, OwnerCompID));
    for (uint256 i; i < itemIndices.length; i++) {
      uint256 id = ids[i];
      if (!haveIDs[i]) {
        LibEntityType.set(components, id, "INVENTORY"); // optimise?
        indexComp.set(id, itemIndices[i]);
        ownerComp.set(id, holderID);
      }
    }
    return ids;
  }

  /// @notice Delete the inventory instance
  function del(IUintComp components, uint256 id) internal {
    LibEntityType.remove(components, id);
    getCompByID(components, ValueCompID).remove(id);
    getCompByID(components, IndexItemCompID).remove(id);
    getCompByID(components, OwnerCompID).remove(id);
  }

  /////////////////
  // INTERACTIONS

  /// @notice increase, and creates new inventory if needed
  function incFor(IUintComp components, uint256 holderID, uint32 itemIndex, uint256 amt) internal {
    uint256 id = createFor(components, holderID, itemIndex);
    ValueComponent(getAddrByID(components, ValueCompID)).inc(id, amt);
    LibData.inc(components, 0, itemIndex, "ITEM_COUNT_GLOBAL", amt);
  }

  function incForBatch(
    IUintComp components,
    uint256 holderID,
    uint32[] memory itemIndices,
    uint256[] memory amts
  ) internal {
    uint256[] memory ids = createForBatch(components, holderID, itemIndices);
    ValueComponent(getAddrByID(components, ValueCompID)).inc(ids, amts);
    LibData.inc(components, 0, itemIndices, "ITEM_COUNT_GLOBAL", amts);
  }

  /// @notice decrease, and creates new inventory if needed
  function decFor(IUintComp components, uint256 holderID, uint32 itemIndex, uint256 amt) internal {
    uint256 id = createFor(components, holderID, itemIndex);
    ValueComponent(getAddrByID(components, ValueCompID)).dec(id, amt);
    LibData.dec(components, 0, itemIndex, "ITEM_COUNT_GLOBAL", amt);
  }

  function decForBatch(
    IUintComp components,
    uint256 holderID,
    uint32[] memory itemIndices,
    uint256[] memory amts
  ) internal {
    uint256[] memory ids = createForBatch(components, holderID, itemIndices);
    ValueComponent(getAddrByID(components, ValueCompID)).dec(ids, amts);
    LibData.dec(components, 0, itemIndices, "ITEM_COUNT_GLOBAL", amts);
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

    if (!LibEntityType.isShape(components, fromID, "INVENTORY"))
      create(components, fromID, fromHolder, itemIndex);
    if (!LibEntityType.isShape(components, toID, "INVENTORY"))
      create(components, toID, toHolder, itemIndex);

    transfer(components, fromID, toID, amt);
  }

  /// @notice sets the balance of an inventory instance
  function set(IUintComp components, uint256 id, uint256 amt) internal {
    ValueComponent(getAddrByID(components, ValueCompID)).set(id, amt);
  }

  /// @notice Transfer the specified fungible inventory amt from=>to entity
  function transfer(IUintComp components, uint256 fromID, uint256 toID, uint256 amt) internal {
    ValueComponent comp = ValueComponent(getAddrByID(components, ValueCompID));

    // removing from
    uint256 fromBal = comp.get(fromID);
    if (fromBal < amt) revert("Inventory: insufficient balance");
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
    return IUintComp(getAddrByID(components, ValueCompID)).safeGet(id);
  }

  function getBalance(IUintComp components, uint256 id) internal view returns (uint256 balance) {
    return ValueComponent(getAddrByID(components, ValueCompID)).get(id);
  }

  function getOwner(IUintComp components, uint256 id) internal view returns (uint256) {
    return OwnerComponent(getAddrByID(components, OwnerCompID)).get(id);
  }

  function getItemIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexItemComponent(getAddrByID(components, IndexItemCompID)).get(id);
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory v) {
    uint256 registryID = LibItem.getByInstance(components, id);
    return LibItem.getType(components, registryID);
  }

  function getTypeByIndex(
    IUintComp components,
    uint32 itemIndex
  ) internal view returns (string memory) {
    // skips registry existence check - its implicitly checked when getting type
    uint256 registryID = LibItem.genID(itemIndex);
    return LibItem.getType(components, registryID);
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
    return LibEntityType.isShape(components, id, "INVENTORY") ? id : 0;
  }

  /// @notice Get all the inventories belonging to a holder
  function getAllForHolder(
    IUintComp components,
    uint256 holderID
  ) internal view returns (uint256[] memory) {
    return
      LibEntityType.queryWithValue(
        components,
        "INVENTORY",
        getCompByID(components, OwnerCompID),
        abi.encode(holderID)
      );
  }

  /////////////////
  // UTILS

  function genID(uint256 holderID, uint32 itemIndex) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("inventory.instance", holderID, itemIndex)));
  }

  /////////////////
  // LOGGING

  /// @notice log increase for item total
  function logItemTotal(IUintComp components, uint256 accID, uint32 itemIndex, uint256 amt) public {
    LibData.inc(components, accID, itemIndex, "ITEM_TOTAL", amt);
  }

  function logItemTotals(
    IUintComp components,
    uint256 accID,
    uint32[] memory itemIndices,
    uint256[] memory amts
  ) public {
    LibData.inc(components, accID, itemIndices, "ITEM_TOTAL", amts);
  }
}
