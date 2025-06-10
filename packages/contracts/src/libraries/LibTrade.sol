// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibTypes } from "solecs/LibTypes.sol";

import { IDOwnsTradeComponent, ID as IDOwnsTradeCompID } from "components/IDOwnsTradeComponent.sol";
import { IdTargetComponent, ID as IdTargetCompID } from "components/IdTargetComponent.sol";
import { KeysComponent, ID as KeysCompID } from "components/KeysComponent.sol";
import { ValuesComponent, ID as ValuesCompID } from "components/ValuesComponent.sol";

import { LibArray } from "libraries/utils/LibArray.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibEmitter } from "libraries/utils/LibEmitter.sol";

import { LibConfig } from "libraries/LibConfig.sol";
import { LibData } from "libraries/LibData.sol";
import { LibInventory, MUSU_INDEX } from "libraries/LibInventory.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibRoom } from "libraries/LibRoom.sol";

uint256 constant TRADE_ROOM = 66;

/**
 * @title Library to facilitate (slow) orderbook-based p2p trading.
 * @author Kore, Acheron
 * @notice Trade X item for Y item. Maker creates and taker fulfills.
 * @dev A target Taker can be specified at Trade creation.
 * @dev
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
    IUintComp comps,
    uint256 accID,
    uint256 targetID,
    Order memory toBuy,
    Order memory toSell
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    LibEntityType.set(comps, id, "TRADE");
    IDOwnsTradeComponent(getAddrByID(comps, IDOwnsTradeCompID)).set(id, accID);
    if (targetID != 0) IdTargetComponent(getAddrByID(comps, IdTargetCompID)).set(id, targetID);

    addBuyOrder(comps, id, toBuy);
    addSellOrder(comps, id, toSell);
  }

  /// @dev modifies existing trade by deleting and recreating buy/sell order info
  function modify(
    IUintComp comps,
    uint256 id,
    uint256 targetID,
    Order memory toBuy,
    Order memory toSell
  ) internal {
    IdTargetComponent(getAddrByID(comps, IdTargetCompID)).set(id, targetID); // override, even if target is 0 (no impact on safeGet)
    cancelBuyOrder(comps, id);
    cancelSellOrder(comps, id);
    addBuyOrder(comps, id, toBuy);
    addSellOrder(comps, id, toSell);
  }

  /// @notice add a Buy Order to a Trade offer
  function addBuyOrder(IUintComp comps, uint256 tradeID, Order memory toBuy) internal {
    uint256 id = genBuyAnchor(tradeID);
    KeysComponent(getAddrByID(comps, KeysCompID)).set(id, toBuy.indices);
    ValuesComponent(getAddrByID(comps, ValuesCompID)).set(id, toBuy.amounts);
  }

  /// @notice add a Sell Order to a Trade offer
  /// @dev transfer specified items from seller to the Trade Entity
  function addSellOrder(IUintComp comps, uint256 tradeID, Order memory toSell) internal {
    uint256 id = genSellAnchor(tradeID);
    KeysComponent(getAddrByID(comps, KeysCompID)).set(id, toSell.indices);
    ValuesComponent(getAddrByID(comps, ValuesCompID)).set(id, toSell.amounts);

    // transferring items
    uint256 accID = IDOwnsTradeComponent(getAddrByID(comps, IDOwnsTradeCompID)).get(tradeID);
    LibInventory.decFor(comps, accID, toSell.indices, toSell.amounts); // implicit balance check
    LibInventory.incFor(comps, id, toSell.indices, toSell.amounts); // store items at sell anchor
  }

  /// @notice revert an order and remove all all associated data
  function cancel(IUintComp comps, uint256 id) internal {
    // removing order data first
    cancelBuyOrder(comps, id);
    cancelSellOrder(comps, id);

    // remove main entity
    LibEntityType.remove(comps, id);
    IDOwnsTradeComponent(getAddrByID(comps, IDOwnsTradeCompID)).remove(id);
    IdTargetComponent(getAddrByID(comps, IdTargetCompID)).remove(id);
  }

  /// @notice revert a Buy Order
  function cancelBuyOrder(IUintComp comps, uint256 tradeID) internal {
    uint256 id = genBuyAnchor(tradeID);
    KeysComponent(getAddrByID(comps, KeysCompID)).remove(id);
    ValuesComponent(getAddrByID(comps, ValuesCompID)).remove(id);
  }

  /// @notice revert a Sell Order
  function cancelSellOrder(IUintComp comps, uint256 tradeID) internal {
    uint256 id = genSellAnchor(tradeID);
    uint32[] memory indices = KeysComponent(getAddrByID(comps, KeysCompID)).extract(id);
    uint256[] memory amounts = ValuesComponent(getAddrByID(comps, ValuesCompID)).extract(id);

    // transferring items back
    uint256 accID = IDOwnsTradeComponent(getAddrByID(comps, IDOwnsTradeCompID)).get(tradeID);
    LibInventory.decFor(comps, id, indices, amounts); // sets to 0
    LibInventory.incFor(comps, accID, indices, amounts); // sends back to account
  }

  /////////////////
  // INTERACTIONS

  /// @notice transfers items and delete trade order
  /// @dev trade tax is processed and logged here
  function execute(IWorld world, IUintComp comps, uint256 tradeID, uint256 takerID) internal {
    KeysComponent keysComp = KeysComponent(getAddrByID(comps, KeysCompID));
    ValuesComponent valuesComp = ValuesComponent(getAddrByID(comps, ValuesCompID));
    uint256 makerID = IDOwnsTradeComponent(getAddrByID(comps, IDOwnsTradeCompID)).extract(tradeID);
    uint256 tax;

    // adjust and data-log tax on the trade order's sell side
    uint256 sellAnchor = genSellAnchor(tradeID);
    uint32[] memory sIndices = keysComp.extract(sellAnchor);
    uint256[] memory sAmts = valuesComp.extract(sellAnchor);
    for (uint256 i; i < sIndices.length; i++) {
      tax = calcTax(sIndices[i], sAmts[i]);
      if (tax > 0) {
        sAmts[i] -= tax;
        LibData.inc(comps, takerID, sIndices[i], "TRADE_TAX", tax);
      }
    }

    // adjust and data-log tax on the trade order's buy side
    uint256 buyAnchor = genBuyAnchor(tradeID);
    uint32[] memory bIndices = keysComp.extract(buyAnchor);
    uint256[] memory bAmts = valuesComp.extract(buyAnchor);
    for (uint256 i; i < bIndices.length; i++) {
      tax = calcTax(bIndices[i], bAmts[i]);
      if (tax > 0) {
        bAmts[i] -= tax;
        LibData.inc(comps, makerID, bIndices[i], "TRADE_TAX", tax);
      }
    }

    // execute the trade
    LibInventory.decFor(comps, takerID, bIndices, bAmts); // take from taker
    LibInventory.incFor(comps, makerID, bIndices, bAmts); // give to maker
    LibInventory.decFor(comps, sellAnchor, sIndices, sAmts); // take from sellOrder
    LibInventory.incFor(comps, takerID, sIndices, sAmts); // give to taker

    // removing the rest
    LibEntityType.remove(comps, tradeID);
    IdTargetComponent(getAddrByID(comps, IdTargetCompID)).remove(tradeID);

    // emit event
    emitTrade(world, Order(bIndices, bAmts), Order(sIndices, sAmts), takerID, makerID);
  }

  /////////////////
  // CHECKERS

  /// @notice verify that the entity is a Trade entity
  function verifyIsTrade(IUintComp comps, uint256 id) public view {
    if (!LibEntityType.isShape(comps, id, "TRADE")) revert("not a trade");
  }

  /// @notice verify that an Account is a Trade's Maker
  function verifyMaker(IUintComp comps, uint256 tradeID, uint256 accID) public view {
    uint256 makerID = IDOwnsTradeComponent(getAddrByID(comps, IDOwnsTradeCompID)).get(tradeID);
    if (makerID != accID) revert("trade owner mismatch");
  }

  /// @notice verify that an Account is a Trade's Taker, if specified
  function verifyTaker(IUintComp comps, uint256 tradeID, uint256 accID) public view {
    uint256 takerID = IdTargetComponent(getAddrByID(comps, IdTargetCompID)).safeGet(tradeID);
    if (takerID != 0 && takerID != accID) revert("trade target mismatch");
  }

  /// @notice verify an Account has not exceeded the maximum allowable open Trade orders
  function verifyMaxOrders(IUintComp comps, uint256 accID) public view {
    uint256 max = LibConfig.get(comps, "MAX_TRADES_PER_ACCOUNT");
    if (getNumOrders(comps, accID) >= max) revert("trade order limit reached");
  }

  /// @notice verify that the trade operation is occurring in a valid room
  function verifyRoom(IUintComp comps, uint256 accID) public view {
    if (LibRoom.get(comps, accID) != TRADE_ROOM) revert("trade room mismatch");
  }

  /// @notice verify that the included items are all tradable
  function verifyTradable(
    IUintComp comps,
    uint32[] memory buyIndices,
    uint32[] memory sellIndices
  ) public view {
    uint32[] memory indices = LibArray.concat(buyIndices, sellIndices);
    if (!LibItem.checkFlag(comps, indices, "NOT_TRADEABLE", false)) revert("tradeable item");
  }

  /////////////////
  // HELPERS

  /// @notice calculate the tax for a given item and amount
  /// @dev hardcoded for now. proper shapes can be determined before more currencies are supported
  function calcTax(uint32 itemIndex, uint256 amount) internal view returns (uint256) {
    if (itemIndex == MUSU_INDEX) return amount / 100;
    return 0;
  }

  /////////////////
  // GETTERS

  function getBuyOrder(IUintComp comps, uint256 tradeID) internal view returns (Order memory) {
    uint256 id = genBuyAnchor(tradeID);
    uint32[] memory indices = KeysComponent(getAddrByID(comps, KeysCompID)).get(id);
    uint256[] memory amounts = ValuesComponent(getAddrByID(comps, ValuesCompID)).get(id);
    return Order(indices, amounts);
  }

  /// @notice gets the number of open orders owned by an account
  function getNumOrders(IUintComp comps, uint256 accID) internal view returns (uint256) {
    return IDOwnsTradeComponent(getAddrByID(comps, IDOwnsTradeCompID)).size(abi.encode(accID));
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

  function logCreate(IUintComp comps, uint256 makerID) public {
    LibData.inc(comps, makerID, 0, "TRADE_CREATE", 1);
  }

  function logComplete(IUintComp comps, uint256 tradeID, uint256 takerID) public {
    uint256 makerID = IDOwnsTradeComponent(getAddrByID(comps, IDOwnsTradeCompID)).get(tradeID);
    LibData.inc(comps, takerID, 0, "TRADE_COMPLETE", 1);
    LibData.inc(comps, makerID, 0, "TRADE_COMPLETE", 1);
    // log items received and sent on both sides
  }

  function logCancel(IUintComp comps, uint256 tradeID, uint256 makerID) public {
    LibData.inc(comps, makerID, 0, "TRADE_CANCEL", 1);
  }

  function emitTrade(
    IWorld world,
    Order memory buyOrder,
    Order memory sellOrder,
    uint256 takerID,
    uint256 makerID
  ) public {
    uint8[] memory _schema = new uint8[](6);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT32_ARRAY); // item indices of buy order
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256_ARRAY); // item amounts of buy order
    _schema[2] = uint8(LibTypes.SchemaValue.UINT32_ARRAY); // item indices of sell order
    _schema[3] = uint8(LibTypes.SchemaValue.UINT256_ARRAY); // item amounts of sell order
    _schema[4] = uint8(LibTypes.SchemaValue.UINT256); // taker's account ID
    _schema[5] = uint8(LibTypes.SchemaValue.UINT256); // seller's account ID

    LibEmitter.emitEvent(
      world,
      "TRADE_EXECUTE",
      _schema,
      abi.encode(
        buyOrder.indices,
        buyOrder.amounts,
        sellOrder.indices,
        sellOrder.amounts,
        takerID,
        makerID
      )
    );
  }
}
