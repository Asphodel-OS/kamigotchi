// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IndexMerchantComponent, ID as IndexMerchantCompID } from "components/IndexMerchantComponent.sol";
import { IsListingComponent, ID as IsListingCompID } from "components/IsListingComponent.sol";
import { PriceBuyComponent, ID as PriceBuyCompID } from "components/PriceBuyComponent.sol";
import { PriceSellComponent, ID as PriceSellCompID } from "components/PriceSellComponent.sol";
import { LibCoin } from "libraries/LibCoin.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibMerchant } from "libraries/LibMerchant.sol";
import { LibAccount } from "libraries/LibAccount.sol";

/*
 * LibListing handles all operations interacting with Listings
 */
library LibListing {
  /////////////////
  // INTERACTIONS

  // creates a merchant listing with the specified parameters
  function create(
    IWorld world,
    IUintComp components,
    uint256 merchantIndex,
    uint256 itemIndex,
    uint256 buyPrice,
    uint256 sellPrice
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsListingComponent(getAddressById(components, IsListingCompID)).set(id);
    IndexMerchantComponent(getAddressById(components, IndexMerchantCompID)).set(id, merchantIndex);
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
    uint256 itemIndex = getItemIndex(components, id);
    uint256 price = getBuyPrice(components, id);
    if (price == 0) {
      return false;
    }

    uint256 inventoryID = LibInventory.get(components, accountID, itemIndex);
    LibInventory.inc(components, inventoryID, amt);
    LibCoin.dec(components, accountID, amt * price);
    return true;
  }

  // processes a sell for amt of item from an account to a listing
  function sellTo(
    IUintComp components,
    uint256 id,
    uint256 accountID,
    uint256 amt
  ) internal returns (bool) {
    uint256 itemIndex = getItemIndex(components, id);
    uint256 price = getSellPrice(components, id);
    if (price == 0) {
      return false;
    }

    uint256 inventoryID = LibInventory.get(components, accountID, itemIndex);
    LibInventory.dec(components, inventoryID, amt);
    LibCoin.inc(components, accountID, amt * price);
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
    return LibMerchant.getByIndex(components, getMerchantIndex(components, id));
  }

  function getMerchantIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexMerchantComponent(getAddressById(components, IndexMerchantCompID)).getValue(id);
  }

  // return the item index of a listing
  function getItemIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).getValue(id);
  }

  function getBuyPrice(IUintComp components, uint256 id) internal view returns (uint256 price) {
    if (hasBuyPrice(components, id))
      price = PriceBuyComponent(getAddressById(components, PriceBuyCompID)).getValue(id);
  }

  function getSellPrice(IUintComp components, uint256 id) internal view returns (uint256 price) {
    if (hasSellPrice(components, id))
      price = PriceSellComponent(getAddressById(components, PriceSellCompID)).getValue(id);
  }

  /////////////////
  // QUERIES

  // gets an item listing from a merchant by its indices
  function get(
    IUintComp components,
    uint256 merchantIndex,
    uint256 itemIndex
  ) internal view returns (uint256 result) {
    uint256[] memory results = _getAllX(components, merchantIndex, itemIndex);
    if (results.length != 0) {
      result = results[0];
    }
  }

  // gets all listings from a merchant by its index
  function getAllForMerchant(
    IUintComp components,
    uint256 merchantIndex
  ) internal view returns (uint256[] memory) {
    return _getAllX(components, merchantIndex, 0);
  }

  // Retrieves all listingsbased on any defined filters
  function _getAllX(
    IUintComp components,
    uint256 merchantIndex,
    uint256 itemIndex
  ) internal view returns (uint256[] memory) {
    uint256 numFilters;
    if (merchantIndex != 0) numFilters++;
    if (itemIndex != 0) numFilters++;

    QueryFragment[] memory fragments = new QueryFragment[](numFilters + 1);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsListingCompID), "");

    uint256 filterCount;
    if (merchantIndex != 0) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IndexMerchantCompID),
        abi.encode(merchantIndex)
      );
    }
    if (itemIndex != 0) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IndexItemCompID),
        abi.encode(itemIndex)
      );
    }
    return LibQuery.query(fragments);
  }
}
