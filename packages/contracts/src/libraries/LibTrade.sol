// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibTypes } from "solecs/LibTypes.sol";

import { IDOwnsTradeComponent, ID as IDOwnsTradeCompID } from "components/IDOwnsTradeComponent.sol";
import { IdTargetComponent, ID as IdTargetCompID } from "components/IdTargetComponent.sol";
import { KeysComponent, ID as KeysCompID } from "components/KeysComponent.sol";
import { ValuesComponent, ID as ValuesCompID } from "components/ValuesComponent.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibEmitter } from "libraries/utils/LibEmitter.sol";

import { LibConfig } from "libraries/LibConfig.sol";
import { LibData } from "libraries/LibData.sol";
import { LibInventory } from "libraries/LibInventory.sol";

/**
 * @notice
 * P2P trading. Trade X item for Y item. Can be open to all, or a specific account (yet unimplemented)
 *
 * Shape: ID = new entity ID
 *  - EntityType: TRADE
 *  - IDOwnsTrade: AccountID of trade requester (seller)
 *  - BuyOrder:
 *    - Keys: item indices
 *    - Values: item amounts
 *  - SellOrder:
 *    - Inventory entities (for items, onyx etc)
 *  - IdTarget: (optional) if only for specific account
 *  - UNIMPLEMENTED: requirements (eg guilds, room specific)
 *
 */
library LibTrade {
  /////////////////
  // SHAPES

  struct Order {
    uint32[] indices;
    uint256[] amounts;
  }

  /// @notice create a friendship entity
  function create(
    IWorld world,
    IUintComp components,
    uint256 accID,
    uint256 targetID,
    Order memory toBuy,
    Order memory toSell
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    LibEntityType.set(components, id, "TRADE");
    IDOwnsTradeComponent(getAddrByID(components, IDOwnsTradeCompID)).set(id, accID);
    if (targetID != 0) IdTargetComponent(getAddrByID(components, IdTargetCompID)).set(id, targetID);

    addBuyOrder(components, id, toBuy);
    addSellOrder(components, id, toSell);
  }

  /// @dev modifies existing trade by deleting and recreating buy/sell order info
  function modify(
    IUintComp components,
    uint256 id,
    uint256 targetID,
    Order memory toBuy,
    Order memory toSell
  ) internal {
    IdTargetComponent(getAddrByID(components, IdTargetCompID)).set(id, targetID); // override, even if target is 0 (no impact on safeGet)

    removeBuyOrder(components, id);
    removeSellOrder(components, id);
    addBuyOrder(components, id, toBuy);
    addSellOrder(components, id, toSell);
  }

  function addBuyOrder(IUintComp components, uint256 tradeID, Order memory toBuy) internal {
    uint256 id = genBuyAnchor(tradeID);
    KeysComponent(getAddrByID(components, KeysCompID)).set(id, toBuy.indices);
    ValuesComponent(getAddrByID(components, ValuesCompID)).set(id, toBuy.amounts);
  }

  /// @dev transfers items from seller to tradeEntity
  function addSellOrder(IUintComp components, uint256 tradeID, Order memory toSell) internal {
    uint256 id = genSellAnchor(tradeID);
    KeysComponent(getAddrByID(components, KeysCompID)).set(id, toSell.indices);
    ValuesComponent(getAddrByID(components, ValuesCompID)).set(id, toSell.amounts);

    // transferring items
    uint256 accID = IDOwnsTradeComponent(getAddrByID(components, IDOwnsTradeCompID)).get(tradeID);
    LibInventory.decFor(components, accID, toSell.indices, toSell.amounts); // implicit balance check
    LibInventory.incFor(components, id, toSell.indices, toSell.amounts); // store items at sell anchor
  }

  function remove(IUintComp components, uint256 id) internal {
    // removing order data first
    removeBuyOrder(components, id);
    removeSellOrder(components, id);

    // remove main entity
    LibEntityType.remove(components, id);
    IDOwnsTradeComponent(getAddrByID(components, IDOwnsTradeCompID)).remove(id);
    IdTargetComponent(getAddrByID(components, IdTargetCompID)).remove(id);
  }

  function removeBuyOrder(IUintComp components, uint256 tradeID) internal {
    uint256 id = genBuyAnchor(tradeID);
    KeysComponent(getAddrByID(components, KeysCompID)).remove(id);
    ValuesComponent(getAddrByID(components, ValuesCompID)).remove(id);
  }

  function removeSellOrder(IUintComp components, uint256 tradeID) internal {
    uint256 id = genSellAnchor(tradeID);
    uint32[] memory indices = KeysComponent(getAddrByID(components, KeysCompID)).extract(id);
    uint256[] memory amounts = ValuesComponent(getAddrByID(components, ValuesCompID)).extract(id);

    // transferring items back
    uint256 accID = IDOwnsTradeComponent(getAddrByID(components, IDOwnsTradeCompID)).get(tradeID);
    LibInventory.decFor(components, id, indices, amounts); // sets to 0
    LibInventory.incFor(components, accID, indices, amounts); // sends back to account
  }

  /////////////////
  // INTERACTIONS

  /// @notice transfers items and delete trade order
  function execute(IWorld world, IUintComp components, uint256 tradeID, uint256 buyer) internal {
    KeysComponent keysComp = KeysComponent(getAddrByID(components, KeysCompID));
    ValuesComponent valuesComp = ValuesComponent(getAddrByID(components, ValuesCompID));
    uint256 buyAnchor = genBuyAnchor(tradeID);
    uint256 sellAnchor = genSellAnchor(tradeID);

    // send to buyer
    uint32[] memory sIndices = keysComp.extract(sellAnchor);
    uint256[] memory sAmts = valuesComp.extract(sellAnchor);
    LibInventory.decFor(components, sellAnchor, sIndices, sAmts); // take from trade sellOrder
    LibInventory.incFor(components, buyer, sIndices, sAmts); // give to buyer

    // send to seller
    uint256 seller = IDOwnsTradeComponent(getAddrByID(components, IDOwnsTradeCompID)).extract(
      tradeID
    );
    uint32[] memory bIndices = keysComp.extract(buyAnchor);
    uint256[] memory bAmts = valuesComp.extract(buyAnchor);
    LibInventory.decFor(components, buyer, bIndices, bAmts); // take from buyer
    LibInventory.incFor(components, seller, bIndices, bAmts); // give to seller

    // removing the rest
    LibEntityType.remove(components, tradeID);
    IdTargetComponent(getAddrByID(components, IdTargetCompID)).remove(tradeID);

    // emit event
    emitTrade(world, Order(bIndices, bAmts), Order(sIndices, sAmts), buyer, seller);
  }

  /////////////////
  // CHECKERS

  function verifyMaxOrders(IUintComp components, uint256 accID) public view {
    uint256 max = LibConfig.get(components, "MAX_TRADES_PER_ACCOUNT");
    if (getNumOrders(components, accID) >= max) revert("trade order limit reached");
  }

  function verifyTarget(IUintComp components, uint256 tradeID, uint256 buyer) public view {
    uint256 targetID = IdTargetComponent(getAddrByID(components, IdTargetCompID)).safeGet(tradeID);
    if (targetID != 0 && targetID != buyer) revert("trade target mismatch");
  }

  function verifySeller(IUintComp components, uint256 tradeID, uint256 seller) public view {
    uint256 accID = IDOwnsTradeComponent(getAddrByID(components, IDOwnsTradeCompID)).get(tradeID);
    if (accID != seller) revert("trade seller mismatch");
  }

  /////////////////
  // GETTERS

  function getBuyOrder(IUintComp components, uint256 tradeID) internal view returns (Order memory) {
    uint256 id = genBuyAnchor(tradeID);
    uint32[] memory indices = KeysComponent(getAddrByID(components, KeysCompID)).get(id);
    uint256[] memory amounts = ValuesComponent(getAddrByID(components, ValuesCompID)).get(id);
    return Order(indices, amounts);
  }

  /// @notice gets the number of open orders owned by an account
  function getNumOrders(IUintComp components, uint256 accID) internal view returns (uint256) {
    return IDOwnsTradeComponent(getAddrByID(components, IDOwnsTradeCompID)).size(abi.encode(accID));
  }

  /////////////////
  // IDs

  function genBuyAnchor(uint256 tradeID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("trade.buy", tradeID)));
  }

  function genSellAnchor(uint256 tradeID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("trade.sell", tradeID)));
  }

  /////////////////
  // LOGGING

  function logCreate(IUintComp components, uint256 accID) public {
    LibData.inc(components, accID, 0, "TRADE_CREATE", 1);
  }

  function logComplete(IUintComp components, uint256 tradeID, uint256 buyer) public {
    uint256 seller = IDOwnsTradeComponent(getAddrByID(components, IDOwnsTradeCompID)).get(tradeID);
    LibData.inc(components, buyer, 0, "TRADE_COMPLETE", 1);
    LibData.inc(components, seller, 0, "TRADE_COMPLETE", 1);
  }

  function emitTrade(
    IWorld world,
    Order memory buyOr,
    Order memory sellOr,
    uint256 buyer,
    uint256 seller
  ) public {
    uint8[] memory _schema = new uint8[](6);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT32_ARRAY);
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256_ARRAY);
    _schema[2] = uint8(LibTypes.SchemaValue.UINT32_ARRAY);
    _schema[3] = uint8(LibTypes.SchemaValue.UINT256_ARRAY);
    _schema[4] = uint8(LibTypes.SchemaValue.UINT256);
    _schema[5] = uint8(LibTypes.SchemaValue.UINT256);

    LibEmitter.emitEvent(
      world,
      "TRADE_EXECUTE",
      _schema,
      abi.encode(buyOr.indices, buyOr.amounts, sellOr.indices, sellOr.amounts, buyer, seller)
    );
  }
}
