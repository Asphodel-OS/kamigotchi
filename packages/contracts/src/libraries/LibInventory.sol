// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibTypes } from "solecs/LibTypes.sol";

import { IDOwnsInventoryComponent as OwnerComponent, ID as OwnerCompID } from "components/IDOwnsInventoryComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibEmitter } from "libraries/utils/LibEmitter.sol";
import { LibERC20 } from "libraries/utils/LibERC20.sol";

import { LibData } from "libraries/LibData.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibStat } from "libraries/LibStat.sol";

////////////////////
// CONSTANTS

// TODO: update these to match the actual item indices on new world
uint32 constant MUSU_INDEX = 1;
uint32 constant GACHA_TICKET_INDEX = 10;
uint32 constant REROLL_TICKET_INDEX = 11;
uint32 constant ONYX_INDEX = 100;
uint32 constant OBOL_INDEX = 1015;

// handles fungible inventory instances
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

  function remove(IUintComp components, uint256 id) internal {
    LibEntityType.remove(components, id);
    IndexItemComponent(getAddrByID(components, IndexItemCompID)).remove(id);
    OwnerComponent(getAddrByID(components, OwnerCompID)).remove(id);
    ValueComponent(getAddrByID(components, ValueCompID)).remove(id);
  }

  function remove(IUintComp components, uint256[] memory ids) internal {
    LibEntityType.remove(components, ids);
    IndexItemComponent(getAddrByID(components, IndexItemCompID)).remove(ids);
    OwnerComponent(getAddrByID(components, OwnerCompID)).remove(ids);
    ValueComponent(getAddrByID(components, ValueCompID)).remove(ids);
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

  function createFor(
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

  /////////////////
  // INTERACTIONS

  /// @notice increase, and creates new inventory if needed
  function incFor(
    IUintComp components,
    uint256 holderID,
    uint32 itemIndex,
    uint256 amt
  ) internal returns (uint256 id) {
    // check if item is symbolink to ERC20
    address tokenAddr = LibItem.getTokenAddr(components, itemIndex);
    if (tokenAddr != address(0)) {
      // is a symbolink ERC20, cannot increase
      revert("LibInv: cannot increase ERC20");
    } else {
      // regular inventory
      id = createFor(components, holderID, itemIndex);
      ValueComponent(getAddrByID(components, ValueCompID)).inc(id, amt);
      logItemTotal(components, holderID, itemIndex, amt);
    }
  }

  function incFor(
    IUintComp components,
    uint256 holderID,
    uint32[] memory itemIndices,
    uint256[] memory amts
  ) internal returns (uint256[] memory ids) {
    ids = new uint256[](itemIndices.length);
    for (uint256 i; i < itemIndices.length; i++)
      ids[i] = incFor(components, holderID, itemIndices[i], amts[i]);
  }

  function incFor(
    IUintComp components,
    uint256[] memory holderIDs,
    uint32 itemIndex,
    uint256[] memory amts
  ) internal returns (uint256[] memory ids) {
    ids = new uint256[](holderIDs.length);
    for (uint256 i; i < holderIDs.length; i++)
      ids[i] = incFor(components, holderIDs[i], itemIndex, amts[i]);
  }

  /// @notice decrease, and creates new inventory if needed
  function decFor(IUintComp components, uint256 holderID, uint32 itemIndex, uint256 amt) internal {
    // check if item is symbolink to ERC20
    address tokenAddr = LibItem.getTokenAddr(components, itemIndex);
    if (tokenAddr != address(0)) {
      // is a symbolink ERC20, spend it
      if (itemIndex == ONYX_INDEX)
        LibERC20.spendOnyx(components, tokenAddr, amt, holderID); // special onyx case
      else LibERC20.spend(components, tokenAddr, amt, holderID);
    } else {
      // regular inventory
      uint256 id = genID(holderID, itemIndex);

      ValueComponent valComp = ValueComponent(getAddrByID(components, ValueCompID));
      uint256 newBal = valComp.safeGet(id) - amt;
      if (newBal == 0) remove(components, id);
      else valComp.set(id, newBal);

      LibData.dec(components, 0, itemIndex, "ITEM_COUNT", amt);
    }
  }

  function decFor(
    IUintComp components,
    uint256[] memory holderIDs,
    uint32 itemIndex,
    uint256[] memory amts
  ) internal {
    for (uint256 i; i < holderIDs.length; i++) decFor(components, holderIDs[i], itemIndex, amts[i]);
  }

  function decFor(
    IUintComp components,
    uint256 holderID,
    uint32[] memory itemIndices,
    uint256[] memory amts
  ) internal {
    for (uint256 i; i < itemIndices.length; i++)
      decFor(components, holderID, itemIndices[i], amts[i]);
  }

  // note: this has to be updated post ERC20 bridge
  function transferFor(
    IUintComp components,
    uint256 holderID,
    uint256 targetID,
    uint32[] memory indices,
    uint256[] memory amts
  ) internal {
    decFor(components, holderID, indices, amts);
    incFor(components, targetID, indices, amts);
  }

  /////////////////
  // CHECKERS

  /// @dev only tradable items can be transferred
  function verifyTransferable(IUintComp components, uint32[] memory indices) internal view {
    if (LibItem.checkFlagAny(components, indices, "NOT_TRADABLE", true)) {
      revert("Transfer includes untradeable item");
    }
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
    return OwnerComponent(getAddrByID(components, OwnerCompID)).getEntitiesWithValue(holderID);
  }

  /////////////////
  // UTILS

  function genID(uint256 holderID, uint32 itemIndex) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("inventory.instance", holderID, itemIndex)));
  }

  function genID(
    uint256 holderID,
    uint32[] memory itemIndices
  ) internal pure returns (uint256[] memory) {
    uint256[] memory ids = new uint256[](itemIndices.length);
    for (uint256 i; i < itemIndices.length; i++) ids[i] = genID(holderID, itemIndices[i]);
    return ids;
  }

  /////////////////
  // LOGGING

  /// @notice log increase for item total
  function logItemTotal(
    IUintComp components,
    uint256 accID,
    uint32 itemIndex,
    uint256 amt
  ) internal {
    uint256[] memory holderIDs = new uint256[](2);
    holderIDs[1] = accID;
    string[] memory types = new string[](2);
    types[0] = "ITEM_COUNT";
    types[1] = "ITEM_TOTAL";

    LibData.inc(components, holderIDs, itemIndex, types, amt);
  }

  /// @notice Log transfer for each index/amount pair individually using a for loop
  function logTransfer(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint256 targetID,
    uint32[] memory indices,
    uint256[] memory amts
  ) internal {
    // event schema
    uint8[] memory _schema = new uint8[](4);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256); // holderID
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256); // targetID
    _schema[2] = uint8(LibTypes.SchemaValue.UINT32); // itemIndex
    _schema[3] = uint8(LibTypes.SchemaValue.UINT256); // amount

    // emit event for each index/amount pair
    for (uint256 i = 0; i < indices.length; i++) {
      LibEmitter.emitEvent(
        world,
        "ITEM_TRANSFER",
        _schema,
        abi.encode(holderID, targetID, indices[i], amts[i])
      );
    }
  }
}
