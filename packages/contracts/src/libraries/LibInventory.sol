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
  function create(IUintComp comps, uint256 id, uint256 holderID, uint32 itemIndex) internal {
    LibEntityType.set(comps, id, "INVENTORY");
    IndexItemComponent(getAddrByID(comps, IndexItemCompID)).set(id, itemIndex);
    OwnerComponent(getAddrByID(comps, OwnerCompID)).set(id, holderID);
    ValueComponent(getAddrByID(comps, ValueCompID)).set(id, 0);
  }

  function create(
    IUintComp comps,
    uint256 holderID,
    uint32 itemIndex
  ) internal returns (uint256 id) {
    id = genID(holderID, itemIndex);
    create(comps, id, holderID, itemIndex);
  }

  function remove(IUintComp comps, uint256 id) internal {
    LibEntityType.remove(comps, id);
    IndexItemComponent(getAddrByID(comps, IndexItemCompID)).remove(id);
    OwnerComponent(getAddrByID(comps, OwnerCompID)).remove(id);
    ValueComponent(getAddrByID(comps, ValueCompID)).remove(id);
  }

  function remove(IUintComp comps, uint256[] memory ids) internal {
    LibEntityType.remove(comps, ids);
    IndexItemComponent(getAddrByID(comps, IndexItemCompID)).remove(ids);
    OwnerComponent(getAddrByID(comps, OwnerCompID)).remove(ids);
    ValueComponent(getAddrByID(comps, ValueCompID)).remove(ids);
  }

  /// @notice checks if inventory exists, creates otherwise
  /**@dev
   * slightly optimises the `check if exist, else create` pattern
   *   - reduces 2 reads and 1 hash
   */
  function createFor(
    IUintComp comps,
    uint256 holderID,
    uint32 itemIndex
  ) internal returns (uint256 id) {
    id = genID(holderID, itemIndex);
    bool has = LibEntityType.checkAndSet(comps, id, "INVENTORY");
    if (!has) {
      IndexItemComponent(getAddrByID(comps, IndexItemCompID)).set(id, itemIndex);
      OwnerComponent(getAddrByID(comps, OwnerCompID)).set(id, holderID);
    }
  }

  function createFor(
    IUintComp comps,
    uint256 holderID,
    uint32[] memory itemIndices
  ) internal returns (uint256[] memory) {
    uint256[] memory ids = new uint256[](itemIndices.length);
    for (uint256 i; i < itemIndices.length; i++) ids[i] = genID(holderID, itemIndices[i]);

    (bool[] memory haveIDs, bool allExist) = LibEntityType.isShapeBatchWithAggregate(
      comps,
      ids,
      "INVENTORY"
    );
    if (allExist) return ids; // all exist, nothing to create

    // create new instances
    IndexItemComponent indexComp = IndexItemComponent(getAddrByID(comps, IndexItemCompID));
    OwnerComponent ownerComp = OwnerComponent(getAddrByID(comps, OwnerCompID));
    for (uint256 i; i < itemIndices.length; i++) {
      uint256 id = ids[i];
      if (!haveIDs[i]) {
        LibEntityType.set(comps, id, "INVENTORY"); // optimise?
        indexComp.set(id, itemIndices[i]);
        ownerComp.set(id, holderID);
      }
    }
    return ids;
  }

  /////////////////
  // INTERACTIONS

  function _incFor(
    IUintComp comps,
    uint256 holderID,
    uint32 itemIndex,
    uint256 amt
  ) internal returns (uint256 id) {
    id = createFor(comps, holderID, itemIndex);
    ValueComponent(getAddrByID(comps, ValueCompID)).inc(id, amt);
    logItemTotal(comps, holderID, itemIndex, amt);
  }

  /// @dev ignores ERC20 items
  function _decFor(
    IUintComp comps,
    uint256 holderID,
    uint32 itemIndex,
    uint256 amt
  ) internal returns (uint256 id) {
    id = genID(holderID, itemIndex); // inventory must be alr created

    // delete inventory by default to prevent state bloat
    ValueComponent valComp = ValueComponent(getAddrByID(comps, ValueCompID));
    uint256 newBal = valComp.safeGet(id) - amt;
    if (newBal == 0) remove(comps, id);
    else valComp.set(id, newBal);

    LibData.dec(comps, 0, itemIndex, "ITEM_COUNT", amt); // log global item count
  }

  /// @notice increase, and creates new inventory if needed
  /// @dev does not allow for ERC20 items increases
  function incFor(
    IUintComp comps,
    uint256 holderID,
    uint32 itemIndex,
    uint256 amt
  ) internal returns (uint256 id) {
    LibItem.verifyNotToken(comps, itemIndex);
    id = _incFor(comps, holderID, itemIndex, amt);
  }

  function incFor(
    IUintComp comps,
    uint256 holderID,
    uint32[] memory itemIndices,
    uint256[] memory amts
  ) internal returns (uint256[] memory ids) {
    ids = new uint256[](itemIndices.length);
    for (uint256 i; i < itemIndices.length; i++)
      ids[i] = incFor(comps, holderID, itemIndices[i], amts[i]);
  }

  function incFor(
    IUintComp comps,
    uint256[] memory holderIDs,
    uint32 itemIndex,
    uint256[] memory amts
  ) internal returns (uint256[] memory ids) {
    ids = new uint256[](holderIDs.length);
    for (uint256 i; i < holderIDs.length; i++)
      ids[i] = incFor(comps, holderIDs[i], itemIndex, amts[i]);
  }

  /// @notice decrease, and creates new inventory if needed
  /// @dev used for burning items. ERC20 items are sent to multisig. Meant for Account->NPC or NPC->NPC
  function decFor(IUintComp comps, uint256 holderID, uint32 itemIndex, uint256 amt) internal {
    // check if item is symbolink to ERC20
    address tokenAddr = LibItem.getTokenAddr(comps, itemIndex);
    if (tokenAddr != address(0)) {
      // is a symbolink ERC20, spend it
      if (itemIndex == ONYX_INDEX)
        LibERC20.spendOnyx(comps, tokenAddr, amt, holderID); // special onyx case
      else LibERC20.spend(comps, tokenAddr, amt, holderID);
    } else {
      // regular inventory
      _decFor(comps, holderID, itemIndex, amt);
    }
  }

  function decFor(
    IUintComp comps,
    uint256[] memory holderIDs,
    uint32 itemIndex,
    uint256[] memory amts
  ) internal {
    for (uint256 i; i < holderIDs.length; i++) decFor(comps, holderIDs[i], itemIndex, amts[i]);
  }

  function decFor(
    IUintComp comps,
    uint256 holderID,
    uint32[] memory itemIndices,
    uint256[] memory amts
  ) internal {
    for (uint256 i; i < itemIndices.length; i++) decFor(comps, holderID, itemIndices[i], amts[i]);
  }

  /// @notice transfer items between entities
  /// @dev allows for ERC20 item transfers. meant for Account->Account
  function transferFor(
    IUintComp comps,
    uint256 fromID,
    uint256 toID,
    uint32 itemIndex,
    uint256 amt
  ) internal {
    _decFor(comps, fromID, itemIndex, amt); // implicit balance check
    _incFor(comps, toID, itemIndex, amt);
  }

  function transferFor(
    IUintComp comps,
    uint256 fromID,
    uint256 toID,
    uint32[] memory itemIndices,
    uint256[] memory amts
  ) internal {
    for (uint256 i = 0; i < itemIndices.length; i++) {
      _decFor(comps, fromID, itemIndices[i], amts[i]); // implicit balance check
      _incFor(comps, toID, itemIndices[i], amts[i]);
    }
  }

  function transferFor(
    IUintComp comps,
    uint256[] memory fromIDs,
    uint256[] memory toIDs,
    uint32 itemIndex,
    uint256 amt
  ) internal {
    for (uint256 i = 0; i < fromIDs.length; i++) {
      _decFor(comps, fromIDs[i], itemIndex, amt); // implicit balance check
      _incFor(comps, toIDs[i], itemIndex, amt);
    }
  }

  function transferFor(
    IUintComp comps,
    uint256[] memory fromIDs,
    uint256[] memory toIDs,
    uint32[] memory itemIndices,
    uint256[] memory amts
  ) internal {
    for (uint256 i = 0; i < fromIDs.length; i++) {
      _decFor(comps, fromIDs[i], itemIndices[i], amts[i]); // implicit balance check
      _incFor(comps, toIDs[i], itemIndices[i], amts[i]);
    }
  }

  /////////////////
  // CHECKERS

  /// @dev only tradable items can be transferred
  function verifyTransferable(IUintComp comps, uint32[] memory indices) internal view {
    if (LibItem.checkFlagAny(comps, indices, "NOT_TRADABLE", true)) {
      revert("Transfer includes untradeable item");
    }
  }

  /////////////////
  // GETTERS

  function getBalanceOf(
    IUintComp comps,
    uint256 holderID,
    uint32 itemIndex
  ) internal view returns (uint256) {
    uint256 id = genID(holderID, itemIndex);
    return IUintComp(getAddrByID(comps, ValueCompID)).safeGet(id);
  }

  function getBalance(IUintComp comps, uint256 id) internal view returns (uint256 balance) {
    return ValueComponent(getAddrByID(comps, ValueCompID)).get(id);
  }

  function getOwner(IUintComp comps, uint256 id) internal view returns (uint256) {
    return OwnerComponent(getAddrByID(comps, OwnerCompID)).get(id);
  }

  function getItemIndex(IUintComp comps, uint256 id) internal view returns (uint32) {
    return IndexItemComponent(getAddrByID(comps, IndexItemCompID)).get(id);
  }

  function getType(IUintComp comps, uint256 id) internal view returns (string memory v) {
    uint256 registryID = LibItem.getByInstance(comps, id);
    return LibItem.getType(comps, registryID);
  }

  function getTypeByIndex(IUintComp comps, uint32 itemIndex) internal view returns (string memory) {
    // skips registry existence check - its implicitly checked when getting type
    uint256 registryID = LibItem.genID(itemIndex);
    return LibItem.getType(comps, registryID);
  }

  /////////////////
  // QUERIES

  /// @notice Get the specified inventory instance.
  function get(
    IUintComp comps,
    uint256 holderID,
    uint32 itemIndex
  ) internal view returns (uint256 result) {
    uint256 id = genID(holderID, itemIndex);
    return LibEntityType.isShape(comps, id, "INVENTORY") ? id : 0;
  }

  /// @notice Get all the inventories belonging to a holder
  function getAllForHolder(
    IUintComp comps,
    uint256 holderID
  ) internal view returns (uint256[] memory) {
    return OwnerComponent(getAddrByID(comps, OwnerCompID)).getEntitiesWithValue(holderID);
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
  function logItemTotal(IUintComp comps, uint256 accID, uint32 itemIndex, uint256 amt) internal {
    uint256[] memory holderIDs = new uint256[](2);
    holderIDs[1] = accID;
    string[] memory types = new string[](2);
    types[0] = "ITEM_COUNT";
    types[1] = "ITEM_TOTAL";

    LibData.inc(comps, holderIDs, itemIndex, types, amt);
  }

  /// @notice Log transfer for each index/amount pair individually using a for loop
  function logTransfer(
    IWorld world,
    IUintComp comps,
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
