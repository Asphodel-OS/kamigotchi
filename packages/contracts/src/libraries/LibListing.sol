// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IndexNPCComponent, ID as IndexNPCComponentID } from "components/IndexNPCComponent.sol";
import { IsListingComponent, ID as IsListingCompID } from "components/IsListingComponent.sol";
import { PriceBuyComponent, ID as PriceBuyCompID } from "components/PriceBuyComponent.sol";
import { PriceSellComponent, ID as PriceSellCompID } from "components/PriceSellComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibInventory, MUSU_INDEX } from "libraries/LibInventory.sol";
import { LibNPC } from "libraries/LibNPC.sol";

/*
 * LibListing handles all operations interacting with Listings
 */
library LibListing {
  /////////////////
  // INTERACTIONS

  // creates a merchant listing with the specified parameters
  function create(
    IUintComp components,
    uint32 npcIndex,
    uint32 itemIndex,
    uint256 buyPrice,
    uint256 sellPrice
  ) internal returns (uint256) {
    uint256 id = genID(npcIndex, itemIndex);
    IsListingComponent(getAddressById(components, IsListingCompID)).set(id);
    IndexNPCComponent(getAddressById(components, IndexNPCComponentID)).set(id, npcIndex);
    IndexItemComponent(getAddressById(components, IndexItemCompID)).set(id, itemIndex);

    // set buy and sell prices if valid
    if (buyPrice != 0) setBuyPrice(components, id, buyPrice);
    if (sellPrice != 0) setSellPrice(components, id, sellPrice);
    return id;
  }

  // sets the prices of a listing. 0 values for price indicate no listing
  function update(IUintComp components, uint256 id, uint256 buyPrice, uint256 sellPrice) internal {
    if (buyPrice == 0) removeBuyPrice(components, id);
    else setBuyPrice(components, id, buyPrice);
    if (sellPrice == 0) removeSellPrice(components, id);
    else setSellPrice(components, id, sellPrice);
  }

  // processes a buy for amt of item from a listing to an account. assumes the account already
  // has the appropriate inventory entity
  function buyFrom(
    IUintComp components,
    uint256 id,
    uint256 accountID,
    uint256 amt
  ) internal returns (bool) {
    uint32 itemIndex = getItemIndex(components, id);
    uint256 price = getBuyPrice(components, id);
    if (price == 0) {
      return false;
    }

    LibInventory.incFor(components, accountID, itemIndex, amt);
    LibInventory.decFor(components, accountID, MUSU_INDEX, amt * price);
    return true;
  }

  // processes a sell for amt of item from an account to a listing
  function sellTo(
    IUintComp components,
    uint256 id,
    uint256 accountID,
    uint256 amt
  ) internal returns (bool) {
    uint32 itemIndex = getItemIndex(components, id);
    uint256 price = getSellPrice(components, id);
    if (price == 0) {
      return false;
    }

    LibInventory.decFor(components, accountID, itemIndex, amt);
    LibInventory.incFor(components, accountID, MUSU_INDEX, amt * price);
    return true;
  }

  /////////////////
  // CHECKERS

  function hasBuyPrice(IUintComp components, uint256 id) internal view returns (bool) {
    return PriceBuyComponent(getAddressById(components, PriceBuyCompID)).has(id);
  }

  function hasSellPrice(IUintComp components, uint256 id) internal view returns (bool) {
    return PriceSellComponent(getAddressById(components, PriceSellCompID)).has(id);
  }

  /////////////////
  // SETTERS

  function removeBuyPrice(IUintComp components, uint256 id) internal {
    if (hasBuyPrice(components, id))
      PriceBuyComponent(getAddressById(components, PriceBuyCompID)).remove(id);
  }

  function removeSellPrice(IUintComp components, uint256 id) internal {
    if (hasSellPrice(components, id))
      PriceSellComponent(getAddressById(components, PriceSellCompID)).remove(id);
  }

  function setBuyPrice(IUintComp components, uint256 id, uint256 price) internal {
    PriceBuyComponent(getAddressById(components, PriceBuyCompID)).set(id, price);
  }

  function setSellPrice(IUintComp components, uint256 id, uint256 price) internal {
    PriceSellComponent(getAddressById(components, PriceSellCompID)).set(id, price);
  }

  /////////////////
  // GETTERS

  // return the ID of the merchant that hosts a listing
  function getMerchant(IUintComp components, uint256 id) internal view returns (uint256) {
    return LibNPC.getByIndex(components, getNPCIndex(components, id));
  }

  function getNPCIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexNPCComponent(getAddressById(components, IndexNPCComponentID)).get(id);
  }

  // return the item index of a listing
  function getItemIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).get(id);
  }

  function getBuyPrice(IUintComp components, uint256 id) internal view returns (uint256 price) {
    if (hasBuyPrice(components, id))
      price = PriceBuyComponent(getAddressById(components, PriceBuyCompID)).get(id);
  }

  function getSellPrice(IUintComp components, uint256 id) internal view returns (uint256 price) {
    if (hasSellPrice(components, id))
      price = PriceSellComponent(getAddressById(components, PriceSellCompID)).get(id);
  }

  /////////////////
  // QUERIES

  // gets an item listing from a merchant by its indices
  function get(
    IUintComp components,
    uint32 merchantIndex,
    uint32 itemIndex
  ) internal view returns (uint256 result) {
    uint256 id = genID(merchantIndex, itemIndex);
    return IsListingComponent(getAddressById(components, IsListingCompID)).has(id) ? id : 0;
  }

  //////////////////
  // UTILS

  function genID(uint32 merchantIndex, uint32 itemIndex) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("listing", merchantIndex, itemIndex)));
  }

  //////////////////
  // DATA LOGGING

  /// @notice log increase for item buy
  function logIncItemBuy(
    IUintComp components,
    uint256 accountID,
    uint32 itemIndex,
    uint256 amt
  ) internal {
    LibDataEntity.inc(components, accountID, 0, "ITEM_BUY_TOTAL", amt);
    LibDataEntity.inc(components, accountID, itemIndex, "ITEM_BUY", amt);
  }

  /// @notice log increase for item sell
  function logIncItemSell(
    IUintComp components,
    uint256 accountID,
    uint32 itemIndex,
    uint256 amt
  ) internal {
    LibDataEntity.inc(components, accountID, 0, "ITEM_SELL_TOTAL", amt);
    LibDataEntity.inc(components, accountID, itemIndex, "ITEM_SELL", amt);
  }

  /// @notice log coins spent
  function logSpendCoin(IUintComp components, uint256 accountID, uint256 amt) internal {
    LibDataEntity.inc(components, accountID, MUSU_INDEX, "ITEM_SPEND", amt);
  }

  /// @notice log coin revenue earned
  function logEarnCoin(IUintComp components, uint256 accountID, uint256 amt) internal {
    LibDataEntity.inc(components, accountID, MUSU_INDEX, "ITEM_REVENUE", amt);
  }
}
