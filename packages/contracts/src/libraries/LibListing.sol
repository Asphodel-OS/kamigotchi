// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IdMerchantComponent, ID as IdMerchantCompID } from "components/IdMerchantComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
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
    uint256 merchantID,
    uint256 itemIndex,
    uint256 buyPrice,
    uint256 sellPrice
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsListingComponent(getAddressById(components, IsListingCompID)).set(id);
    IdMerchantComponent(getAddressById(components, IdMerchantCompID)).set(id, merchantID);
    IndexItemComponent(getAddressById(components, IndexItemCompID)).set(id, itemIndex);

    // set buy and sell prices if valid
    if (buyPrice != 0) {
      PriceBuyComponent(getAddressById(components, PriceBuyCompID)).set(id, buyPrice);
    }
    if (sellPrice != 0) {
      PriceSellComponent(getAddressById(components, PriceSellCompID)).set(id, sellPrice);
    }

    return id;
  }

  // processes a buy for amt of item from a listing to an account. assumes the account already
  // has the appropriate inventory entity
  function buyFrom(
    IUintComp components,
    uint256 id,
    uint256 accountID,
    uint256 amt
  ) internal returns (bool) {
    uint256 itemIndex = IndexItemComponent(getAddressById(components, IndexItemCompID)).getValue(
      id
    );
    uint256 price = PriceBuyComponent(getAddressById(components, PriceBuyCompID)).getValue(id);
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
    uint256 itemIndex = IndexItemComponent(getAddressById(components, IndexItemCompID)).getValue(
      id
    );
    uint256 price = PriceSellComponent(getAddressById(components, PriceSellCompID)).getValue(id);
    if (price == 0) {
      return false;
    }

    uint256 inventoryID = LibInventory.get(components, accountID, itemIndex);
    LibInventory.dec(components, inventoryID, amt);
    LibCoin.inc(components, accountID, amt * price);
    return true;
  }

  /////////////////
  // COMPONENT RETRIEVAL

  // return the merchant ID of a listing
  function getMerchant(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdMerchantComponent(getAddressById(components, IdMerchantCompID)).getValue(id);
  }

  // return the item index of a listing
  function getItemIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexItemComponent(getAddressById(components, IndexItemCompID)).getValue(id);
  }

  /////////////////
  // QUERIES

  // gets an item listing from a merchant by its index
  function get(
    IUintComp components,
    uint256 merchantID,
    uint256 itemIndex
  ) internal view returns (uint256 result) {
    uint256[] memory results = _getAllX(components, merchantID, itemIndex);
    if (results.length != 0) {
      result = results[0];
    }
  }

  // gets all listings from a merchant
  function getAllForMerchant(
    IUintComp components,
    uint256 merchantID
  ) internal view returns (uint256[] memory) {
    return _getAllX(components, merchantID, 0);
  }

  // Retrieves all listingsbased on any defined filters
  function _getAllX(
    IUintComp components,
    uint256 merchantID,
    uint256 itemIndex
  ) internal view returns (uint256[] memory) {
    uint256 numFilters;
    if (merchantID != 0) numFilters++;
    if (itemIndex != 0) numFilters++;

    QueryFragment[] memory fragments = new QueryFragment[](numFilters + 1);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsListingCompID), "");

    uint256 filterCount;
    if (merchantID != 0) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IdMerchantCompID),
        abi.encode(merchantID)
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
