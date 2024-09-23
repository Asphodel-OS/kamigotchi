// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IndexNPCComponent, ID as IndexNPCComponentID } from "components/IndexNPCComponent.sol";
import { IsListingComponent, ID as IsListingCompID } from "components/IsListingComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { Condition, LibConditional } from "libraries/LibConditional.sol";
import { LibComp } from "libraries/utils/LibComp.sol";
import { LibData } from "libraries/LibData.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibInventory, MUSU_INDEX } from "libraries/LibInventory.sol";
import { LibNPC } from "libraries/LibNPC.sol";

/*
 * LibListing handles all operations interacting with Listings
 */
library LibListing {
  using LibComp for IUintComp;

  /////////////////
  // SHAPES

  // creates a merchant listing with the specified parameters
  function create(
    IUintComp components,
    uint32 npcIndex,
    uint32 itemIndex,
    uint256 buyPrice,
    uint256 sellPrice
  ) internal returns (uint256 id) {
    id = genID(npcIndex, itemIndex);
    LibEntityType.set(components, id, "LISTING");
    IsListingComponent(getAddrByID(components, IsListingCompID)).set(id); // deprecated

    IndexNPCComponent(getAddrByID(components, IndexNPCComponentID)).set(id, npcIndex);
    IndexItemComponent(getAddrByID(components, IndexItemCompID)).set(id, itemIndex);

    // set buy and sell prices if valid
    if (buyPrice != 0) setBuyPrice(components, id, buyPrice);
    if (sellPrice != 0) setSellPrice(components, id, sellPrice);
  }

  /// @notice creates a requirement for a listing
  /// @dev requirements apply equally to buy and sell
  function createRequirement(
    IWorld world,
    IUintComp components,
    uint256 regID,
    Condition memory data
  ) internal returns (uint256) {
    return LibConditional.createFor(world, components, data, genReqParentID(regID));
  }

  function remove(IUintComp components, uint256 id) internal {
    LibEntityType.remove(components, id);
    IsListingComponent(getAddrByID(components, IsListingCompID)).remove(id);

    IndexNPCComponent(getAddrByID(components, IndexNPCComponentID)).remove(id);
    IndexItemComponent(getAddrByID(components, IndexItemCompID)).remove(id);

    ValueComponent valueComp = ValueComponent(getAddrByID(components, ValueCompID));
    valueComp.remove(genBuyParentID(id));
    valueComp.remove(genSellParentID(id));

    uint256[] memory requirements = LibConditional.queryFor(components, genReqParentID(id));
    for (uint256 i; i < requirements.length; i++)
      LibConditional.remove(components, requirements[i]);
  }

  /////////////////
  // INTERACTIONS

  // processes a buy for amt of item from a listing to an account. assumes the account already
  // has the appropriate inventory entity
  function buy(
    IUintComp components,
    uint256 listingID,
    uint256 accID,
    uint32 itemIndex,
    uint256 amt
  ) internal returns (uint256 total) {
    uint256 price = getBuyPrice(components, listingID);
    require(price > 0, "Listing.Buy(): invalid listing");

    total = amt * price;
    LibInventory.incFor(components, accID, itemIndex, amt);
    LibInventory.decFor(components, accID, MUSU_INDEX, total);
  }

  // processes a sell for amt of item from an account to a listing
  function sell(
    IUintComp components,
    uint256 listingID,
    uint256 accID,
    uint32 itemIndex,
    uint256 amt
  ) internal returns (uint256 total) {
    uint256 price = getSellPrice(components, listingID);
    require(price > 0, "Listing.Sell(): invalid listing");

    total = amt * price;
    LibInventory.decFor(components, accID, itemIndex, amt);
    LibInventory.incFor(components, accID, MUSU_INDEX, total);
  }

  /////////////////
  // CHECKERS

  function meetsRequirements(
    IUintComp components,
    uint256 listingID,
    uint256 accID
  ) internal view returns (bool) {
    uint256[] memory requirements = LibConditional.queryFor(components, genReqParentID(listingID));
    return LibConditional.checkConditions(components, requirements, accID);
  }

  /////////////////
  // GETTERS

  // gets an item listing from a merchant by its indices
  function get(
    IUintComp components,
    uint32 merchantIndex,
    uint32 itemIndex
  ) internal view returns (uint256 result) {
    uint256 id = genID(merchantIndex, itemIndex);
    return LibEntityType.isShape(components, id, "LISTING") ? id : 0;
  }

  function getBuyPrice(IUintComp components, uint256 id) internal view returns (uint256 price) {
    uint256 ptr = genBuyParentID(id);
    return IUintComp(getAddrByID(components, ValueCompID)).safeGetUint256(ptr);
  }

  function getSellPrice(IUintComp components, uint256 id) internal view returns (uint256 price) {
    uint256 ptr = genSellParentID(id);
    return IUintComp(getAddrByID(components, ValueCompID)).safeGetUint256(ptr);
  }

  //////////////////
  // SETTERS

  function setBuyPrice(IUintComp components, uint256 id, uint256 price) internal {
    uint256 ptr = genBuyParentID(id);
    ValueComponent(getAddrByID(components, ValueCompID)).set(ptr, price);
  }

  function setSellPrice(IUintComp components, uint256 id, uint256 price) internal {
    uint256 ptr = genSellParentID(id);
    ValueComponent(getAddrByID(components, ValueCompID)).set(ptr, price);
  }

  //////////////////
  // UTILS

  function genID(uint32 merchantIndex, uint32 itemIndex) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("listing", merchantIndex, itemIndex)));
  }

  function genReqParentID(uint256 regID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("listing.requirement", regID)));
  }

  function genBuyParentID(uint256 regID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("listing.buy", regID)));
  }

  function genSellParentID(uint256 regID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("listing.sell", regID)));
  }

  //////////////////
  // DATA LOGGING

  /// @notice log increase for item buy
  function logIncItemBuy(
    IUintComp components,
    uint256 accID,
    uint32 itemIndex,
    uint256 amt
  ) internal {
    uint32[] memory indices = new uint32[](3);
    indices[1] = itemIndex;
    indices[2] = itemIndex;
    string[] memory types = new string[](3);
    types[0] = "ITEM_BUY_TOTAL";
    types[1] = "ITEM_BUY";
    types[2] = "ITEM_TOTAL";

    LibData.inc(components, accID, indices, types, amt);
  }

  /// @notice log increase for item sell
  function logIncItemSell(
    IUintComp components,
    uint256 accID,
    uint32 itemIndex,
    uint256 amt
  ) internal {
    uint32[] memory indices = new uint32[](2);
    indices[1] = itemIndex;
    string[] memory types = new string[](2);
    types[0] = "ITEM_SELL_TOTAL";
    types[1] = "ITEM_SELL";

    LibData.inc(components, accID, indices, types, amt);
  }

  /// @notice log coins spent
  function logSpendCoin(IUintComp components, uint256 accID, uint256 amt) internal {
    LibData.inc(components, accID, MUSU_INDEX, "ITEM_SPEND", amt);
  }

  /// @notice log coin revenue earned
  function logEarnCoin(IUintComp components, uint256 accID, uint256 amt) internal {
    uint32[] memory indices = new uint32[](2);
    indices[0] = MUSU_INDEX;
    indices[1] = MUSU_INDEX;
    string[] memory types = new string[](2);
    types[0] = "ITEM_REVENUE";
    types[1] = "ITEM_TOTAL";

    LibData.inc(components, accID, indices, types, amt);

    // LibData.inc(components, accID, MUSU_INDEX, "ITEM_REVENUE", amt);
  }
}
