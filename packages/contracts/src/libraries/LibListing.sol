// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddrByID } from "solecs/utils.sol";

import { ScaleComponent, ID as ScaleCompID } from "components/ScaleComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ID as ValueCompID } from "components/ValueComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibConditional } from "libraries/LibConditional.sol";
import { LibData } from "libraries/LibData.sol";
import { LibInventory, MUSU_INDEX } from "libraries/LibInventory.sol";
import { LibListingRegistry } from "libraries/LibListingRegistry.sol";

/** @notice
 * LibListing handles all operations interacting with Listings
 * The Buy Side and Sell Side pricing can be defined in a handful of ways:
 *   - FIXED: direct read of ValueComp on the actual Listing entity
 *   - GDA: dynamic price calc based the Balance, TimeStart and Value target of the Listing
 *   - SCALED (sell only): scaled version of the Buy Side price calc
 */
library LibListing {
  using LibComp for IUintComp;
  using LibString for string;
  using SafeCastLib for int32;

  // processes a buy for amt of item from a listing to an account. assumes the account already
  // has the appropriate inventory entity
  function buy(
    IUintComp comps,
    uint256 id,
    uint256 accID,
    uint32 itemIndex,
    uint256 amt
  ) internal returns (uint256 total) {
    uint256 price = calcBuyPrice(comps, id, amt);
    if (price == 0) revert("LibListing: invalid buy price");
    LibInventory.incFor(comps, accID, itemIndex, amt);
    LibInventory.decFor(comps, accID, MUSU_INDEX, price);
  }

  // processes a sell for amt of item from an account to a listing
  function sell(
    IUintComp comps,
    uint256 id,
    uint256 accID,
    uint32 itemIndex,
    uint256 amt
  ) internal returns (uint256 total) {
    uint256 price = calcSellPrice(comps, id, amt);
    if (price == 0) revert("LibListing: invalid sell price");
    LibInventory.decFor(comps, accID, itemIndex, amt);
    LibInventory.incFor(comps, accID, MUSU_INDEX, price);
  }

  /////////////////
  // CHECKERS

  function verifyRequirements(IUintComp comps, uint256 id, uint256 accID) public view {
    if (!meetsRequirements(comps, id, accID)) revert("reqs not met");
  }

  function meetsRequirements(
    IUintComp comps,
    uint256 id,
    uint256 accID
  ) public view returns (bool) {
    uint256 requirementAnchor = LibListingRegistry.genReqAnchor(id);
    uint256[] memory requirements = LibConditional.queryFor(comps, requirementAnchor);
    return LibConditional.check(comps, requirements, accID);
  }

  /////////////////
  // CALCULATIONS

  function calcBuyPrice(
    IUintComp comps,
    uint256 id,
    uint256 amt
  ) internal view returns (uint256 price) {
    uint256 buyID = LibListingRegistry.genBuyID(id);
    string memory type_ = TypeComponent(getAddrByID(comps, TypeCompID)).get(buyID);
    if (type_.eq("FIXED")) {
      return IUintComp(getAddrByID(comps, ValueCompID)).safeGet(id) * amt;
    } else revert("LibListing: invalid buy type");
  }

  // calculate the sell price from the listing entity
  // NOTE: scaled pricing is defined with 3 degrees of precision
  function calcSellPrice(
    IUintComp comps,
    uint256 id,
    uint256 amt
  ) internal view returns (uint256 price) {
    uint256 sellID = LibListingRegistry.genSellID(id);
    string memory type_ = TypeComponent(getAddrByID(comps, TypeCompID)).get(sellID);
    if (type_.eq("FIXED")) {
      return IUintComp(getAddrByID(comps, ValueCompID)).safeGet(id) * amt;
    } else if (type_.eq("SCALED")) {
      int32 scale = ScaleComponent(getAddrByID(comps, ScaleCompID)).get(sellID);
      if (scale > 1e3 || scale < 0) revert("LibListing: invalid sell scale");
      return (calcBuyPrice(comps, id, amt) * scale.toUint256()) / 1e3;
    } else revert("LibListing: invalid sell type");
  }

  //////////////////
  // DATA LOGGING

  /// @notice log increase for item buy
  function logIncItemBuy(IUintComp comps, uint256 accID, uint32 itemIndex, uint256 amt) internal {
    uint32[] memory indices = new uint32[](3);
    indices[1] = itemIndex;
    indices[2] = itemIndex;
    string[] memory types = new string[](3);
    types[0] = "ITEM_BUY_TOTAL";
    types[1] = "ITEM_BUY";
    types[2] = "ITEM_TOTAL";

    LibData.inc(comps, accID, indices, types, amt);
  }

  /// @notice log increase for item sell
  function logIncItemSell(IUintComp comps, uint256 accID, uint32 itemIndex, uint256 amt) internal {
    uint32[] memory indices = new uint32[](2);
    indices[1] = itemIndex;
    string[] memory types = new string[](2);
    types[0] = "ITEM_SELL_TOTAL";
    types[1] = "ITEM_SELL";

    LibData.inc(comps, accID, indices, types, amt);
  }

  /// @notice log coins spent
  function logSpendCoin(IUintComp comps, uint256 accID, uint256 amt) internal {
    LibData.inc(comps, accID, MUSU_INDEX, "ITEM_SPEND", amt);
  }

  /// @notice log coin revenue earned
  function logEarnCoin(IUintComp comps, uint256 accID, uint256 amt) internal {
    uint32[] memory indices = new uint32[](2);
    indices[0] = MUSU_INDEX;
    indices[1] = MUSU_INDEX;
    string[] memory types = new string[](2);
    types[0] = "ITEM_REVENUE";
    types[1] = "ITEM_TOTAL";

    LibData.inc(comps, accID, indices, types, amt);
    // LibData.inc(comps, accID, MUSU_INDEX, "ITEM_REVENUE", amt);
  }
}
