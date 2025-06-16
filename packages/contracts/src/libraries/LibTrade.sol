// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibTypes } from "solecs/LibTypes.sol";

import { IDOwnsTradeComponent, ID as IDOwnsTradeCompID } from "components/IDOwnsTradeComponent.sol";
import { IdTargetComponent, ID as IdTargetCompID } from "components/IdTargetComponent.sol";
import { KeysComponent, ID as KeysCompID } from "components/KeysComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { ValuesComponent, ID as ValuesCompID } from "components/ValuesComponent.sol";

import { LibArray } from "libraries/utils/LibArray.sol";
import { LibComp } from "libraries/utils/LibComp.sol";
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
 *  - BuyOrder/SellOrder:
 *    - Keys: item indices
 *    - Values: item amounts
 *  - Inventory entities (of items in transit)
 *  - IdTarget: (optional) if only for specific account
 *  - UNIMPLEMENTED: requirements (eg guilds, room specific)
 *
 */
library LibTrade {
  using LibComp for IComponent;
  using LibString for string;

  /////////////////
  // SHAPES

  struct Order {
    uint32[] indices;
    uint256[] amounts;
  }

  /////////////////
  // CREATE

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
    StateComponent(getAddrByID(comps, StateCompID)).set(id, string("PENDING"));
    IDOwnsTradeComponent(getAddrByID(comps, IDOwnsTradeCompID)).set(id, accID);
    if (targetID != 0) IdTargetComponent(getAddrByID(comps, IdTargetCompID)).set(id, targetID);

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
    uint256 makerID = IDOwnsTradeComponent(getAddrByID(comps, IDOwnsTradeCompID)).get(tradeID);
    LibInventory.decFor(comps, makerID, toSell.indices, toSell.amounts); // implicit balance check
    LibInventory.incFor(comps, tradeID, toSell.indices, toSell.amounts); // store items at sell anchor
  }

  /////////////////
  // EXECUTE

  /// @notice execute a Trade
  function execute(IWorld world, IUintComp comps, uint256 id, uint256 takerID) internal {
    executeBuyOrder(comps, id, takerID);
    executeSellOrder(comps, id, takerID);
    IdTargetComponent(getAddrByID(comps, IdTargetCompID)).set(id, takerID);
    StateComponent(getAddrByID(comps, StateCompID)).set(id, string("EXECUTED"));
  }

  /// @notice execute a Buy Order (transfers items between Maker and Taker)
  /// @dev handles data logging
  function executeBuyOrder(IUintComp comps, uint256 tradeID, uint256 takerID) internal {
    uint256 id = genBuyAnchor(tradeID);
    uint32[] memory indices = KeysComponent(getAddrByID(comps, KeysCompID)).get(id);
    uint256[] memory amts = ValuesComponent(getAddrByID(comps, ValuesCompID)).get(id);

    // log the trade amounts
    uint256 makerID = IDOwnsTradeComponent(getAddrByID(comps, IDOwnsTradeCompID)).get(tradeID);
    logReceive(comps, makerID, indices, amts);
    logSpend(comps, takerID, indices, amts);

    // transfer Buy Order items from Taker to Trade
    LibInventory.decFor(comps, takerID, indices, amts);
    LibInventory.incFor(comps, tradeID, indices, amts);
  }

  /// @notice execute a Sell Order (transfers items between Sell Order and Taker)
  /// @dev trade tax is processed and logged here
  /// @dev handles data logging
  function executeSellOrder(IUintComp comps, uint256 tradeID, uint256 takerID) internal {
    uint256 id = genSellAnchor(tradeID);
    uint32[] memory indices = KeysComponent(getAddrByID(comps, KeysCompID)).get(id);
    uint256[] memory amts = ValuesComponent(getAddrByID(comps, ValuesCompID)).get(id);

    // log items the taker receives, pre-tax
    uint256 makerID = IDOwnsTradeComponent(getAddrByID(comps, IDOwnsTradeCompID)).get(tradeID);
    logReceive(comps, takerID, indices, amts);
    logSpend(comps, makerID, indices, amts);

    // adjust for tax
    uint256 tax;
    for (uint256 i; i < indices.length; i++) {
      tax = calcTax(comps, indices[i], amts[i]);
      if (tax > 0) {
        amts[i] -= tax;
        LibData.inc(comps, takerID, indices[i], "TRADE_TAX", tax);
      }
    }

    // transfer Sell Order items from Trade to Taker
    LibInventory.decFor(comps, tradeID, indices, amts);
    LibInventory.incFor(comps, takerID, indices, amts);
  }

  /////////////////
  // COMPLETE

  /// @notice complete a Trade
  function complete(IWorld world, IUintComp comps, uint256 id, uint256 makerID) internal {
    // process orders
    completeBuyOrder(comps, id, makerID);
    completeSellOrder(comps, id, makerID);

    // strip the rest of the data
    LibEntityType.remove(comps, id);
    IDOwnsTradeComponent(getAddrByID(comps, IDOwnsTradeCompID)).remove(id);
    IdTargetComponent(getAddrByID(comps, IdTargetCompID)).remove(id);
    StateComponent(getAddrByID(comps, StateCompID)).remove(id);
  }

  /// @notice complete a Buy Order (transfers items from Trade to Maker, cleanup)
  /// @dev trade tax is processed and logged here
  function completeBuyOrder(IUintComp comps, uint256 tradeID, uint256 makerID) internal {
    uint256 id = genBuyAnchor(tradeID);
    uint32[] memory indices = KeysComponent(getAddrByID(comps, KeysCompID)).extract(id);
    uint256[] memory amts = ValuesComponent(getAddrByID(comps, ValuesCompID)).extract(id);

    // adjust and data-log tax on the trade order's buy side
    uint256 tax;
    for (uint256 i; i < indices.length; i++) {
      tax = calcTax(comps, indices[i], amts[i]);
      if (tax > 0) {
        amts[i] -= tax;
        LibData.inc(comps, makerID, indices[i], "TRADE_TAX", tax);
      }
    }

    // transfer Buy Order items from Trade to Maker
    LibInventory.decFor(comps, tradeID, indices, amts);
    LibInventory.incFor(comps, makerID, indices, amts);
  }

  /// @notice complete a Sell Order (cleanup, sell side should already be fulfilled)
  function completeSellOrder(IUintComp comps, uint256 tradeID, uint256 makerID) internal {
    uint256 id = genSellAnchor(tradeID);
    KeysComponent(getAddrByID(comps, KeysCompID)).remove(id);
    ValuesComponent(getAddrByID(comps, ValuesCompID)).remove(id);
  }

  /////////////////
  // CANCEL

  /// @notice revert an order and remove all all associated data
  function cancel(IUintComp comps, uint256 id) internal {
    // remove order data first
    cancelBuyOrder(comps, id);
    cancelSellOrder(comps, id);

    // remove main entity
    LibEntityType.remove(comps, id);
    IDOwnsTradeComponent(getAddrByID(comps, IDOwnsTradeCompID)).remove(id);
    IdTargetComponent(getAddrByID(comps, IdTargetCompID)).remove(id);
    StateComponent(getAddrByID(comps, StateCompID)).remove(id);
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

    // transfer items back from Trade to Maker
    uint256 makerID = IDOwnsTradeComponent(getAddrByID(comps, IDOwnsTradeCompID)).get(tradeID);
    LibInventory.decFor(comps, tradeID, indices, amounts); // sets to 0
    LibInventory.incFor(comps, makerID, indices, amounts); // sends back to Maker
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
    if (makerID != accID) revert("Trade owner mismatch");
  }

  /// @notice verify that an Account is a Trade's Maker
  function verifyNotMaker(IUintComp comps, uint256 tradeID, uint256 accID) public view {
    uint256 makerID = IDOwnsTradeComponent(getAddrByID(comps, IDOwnsTradeCompID)).get(tradeID);
    if (makerID == accID) revert("Trade cannot be executed by Maker");
  }

  /// @notice verify that an Account is a Trade's Taker, if specified
  function verifyTaker(IUintComp comps, uint256 tradeID, uint256 accID) public view {
    uint256 takerID = IdTargetComponent(getAddrByID(comps, IdTargetCompID)).safeGet(tradeID);
    if (takerID != 0 && takerID != accID) revert("Trade target mismatch");
  }

  /// @notice verify an Account has not exceeded the maximum allowable open Trade orders
  function verifyMaxOrders(IUintComp comps, uint256 accID) public view {
    uint256 max = LibConfig.get(comps, "MAX_TRADES_PER_ACCOUNT");
    if (getNumOrders(comps, accID) >= max) revert("Trade order limit reached");
  }

  /// @notice verify that the trade operation is occurring in a valid room
  function verifyRoom(IUintComp comps, uint256 accID) public view {
    if (LibRoom.get(comps, accID) != TRADE_ROOM) revert("Trade room mismatch");
  }

  function verifyState(IUintComp comps, uint256 id, string memory state) public view {
    bool stateMatches = getCompByID(comps, StateCompID).eqString(id, state);
    if (!stateMatches) revert(LibString.concat("Trade is not ", state));
  }

  /// @notice verify that the included items are all tradable
  function verifyTradable(
    IUintComp comps,
    uint32[] memory buyIndices,
    uint32[] memory sellIndices
  ) public view {
    uint32[] memory indices = LibArray.concat(buyIndices, sellIndices);
    if (LibItem.checkFlagAny(comps, indices, "NOT_TRADABLE", true)) {
      revert("Trade includes untradeable item");
    }
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
  // HELPERS

  /// @notice calculate the tax for a given item and amount
  /// @dev this structure is inefficient but necessary when we support more currencies
  function calcTax(
    IUintComp comps,
    uint32 itemIndex,
    uint256 amount
  ) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(comps, "TRADE_TAX_RATE");
    if (itemIndex == MUSU_INDEX) return (amount * config[1]) / 10 ** config[0];
    return 0;
  }

  function genBuyAnchor(uint256 tradeID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("trade.buy", tradeID)));
  }

  function genSellAnchor(uint256 tradeID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("trade.sell", tradeID)));
  }

  /////////////////
  // LOGGING

  /// @notice log the Creation of a Trade by the calling Account
  /// @dev accID should always be the Maker
  function logCreate(IUintComp comps, uint256 accID) public {
    LibData.inc(comps, accID, 0, "TRADE_CREATE", 1);
  }

  /// @notice log the Execution of a Trade by the calling Account
  /// @dev accID should always be the Taker
  function logExecute(IUintComp comps, uint256 accID) public {
    LibData.inc(comps, accID, 0, "TRADE_EXECUTE", 1);
  }

  /// @notice log the Completion of a Trade by the calling Account
  /// @dev accID should always be the Maker
  function logComplete(IUintComp comps, uint256 accID) public {
    LibData.inc(comps, accID, 0, "TRADE_COMPLETE", 1);
  }

  /// @notice log the Cancellation of a Trade by the calling Account
  /// @dev accID should always be the Maker
  function logCancel(IUintComp comps, uint256 accID) public {
    LibData.inc(comps, accID, 0, "TRADE_CANCEL", 1);
  }

  /// @notice log the item amounts received by an Account Trade
  function logReceive(
    IUintComp comps,
    uint256 accID,
    uint32[] memory itemIndices,
    uint256[] memory amts
  ) public {
    LibData.inc(comps, accID, itemIndices, "TRADE_RECEIVE", amts);
  }

  /// @notice log the item amounts Spent by an Account in Trade
  function logSpend(
    IUintComp comps,
    uint256 accID,
    uint32[] memory itemIndices,
    uint256[] memory amts
  ) public {
    LibData.inc(comps, accID, itemIndices, "TRADE_SPEND", amts);
  }

  /////////////////
  // EVENT EMISSION

  function emitTradeCreate(
    IWorld world,
    uint256 tradeID,
    uint256 makerID,
    uint256 takerID,
    Order memory buyOrder,
    Order memory sellOrder
  ) public {
    uint8[] memory _schema = new uint8[](7);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256); // Trade ID
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256); // Maker's account ID
    _schema[2] = uint8(LibTypes.SchemaValue.UINT256); // assigened Taker's account ID
    _schema[3] = uint8(LibTypes.SchemaValue.UINT32_ARRAY); // item indices of buy order
    _schema[4] = uint8(LibTypes.SchemaValue.UINT256_ARRAY); // item amounts of buy order
    _schema[5] = uint8(LibTypes.SchemaValue.UINT32_ARRAY); // item indices of sell order
    _schema[6] = uint8(LibTypes.SchemaValue.UINT256_ARRAY); // item amounts of sell order

    LibEmitter.emitEvent(
      world,
      "TRADE_CREATE",
      _schema,
      abi.encode(
        tradeID,
        makerID,
        takerID,
        buyOrder.indices,
        buyOrder.amounts,
        sellOrder.indices,
        sellOrder.amounts
      )
    );
  }

  /// @notice emit the Execution event of a Trade
  function emitTradeExecute(IWorld world, uint256 tradeID, uint256 takerID) public {
    uint8[] memory _schema = new uint8[](2);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256); // Trade ID
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256); // Taker's Account ID
    LibEmitter.emitEvent(world, "TRADE_EXECUTE", _schema, abi.encode(tradeID, takerID));
  }

  /// @notice emit the Completion event of a Trade
  function emitTradeComplete(IWorld world, uint256 tradeID, uint256 makerID) public {
    uint8[] memory _schema = new uint8[](2);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256); // Trade ID
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256); // Maker's Account ID
    LibEmitter.emitEvent(world, "TRADE_COMPLETE", _schema, abi.encode(tradeID, makerID));
  }

  /// @notice emit the Cancellation event of a Trade
  function emitTradeCancel(IWorld world, uint256 tradeID, uint256 makerID) public {
    uint8[] memory _schema = new uint8[](2);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256); // Trade ID
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256); // Maker's Account ID
    LibEmitter.emitEvent(world, "TRADE_CANCEL", _schema, abi.encode(tradeID, makerID));
  }
}
