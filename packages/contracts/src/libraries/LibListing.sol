// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";
import { LibTypes } from "solecs/LibTypes.sol";

import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { DecayComponent, ID as DecayCompID } from "components/DecayComponent.sol";
import { PeriodComponent, ID as PeriodCompID } from "components/PeriodComponent.sol";
import { RateComponent, ID as RateCompID } from "components/RateComponent.sol";
import { ScaleComponent, ID as ScaleCompID } from "components/ScaleComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibEmitter } from "libraries/utils/LibEmitter.sol";
import { LibGDA, Params as GDAParams } from "libraries/utils/LibGDA.sol";
import { LibConditional } from "libraries/LibConditional.sol";
import { LibData } from "libraries/LibData.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibListingRegistry as LibRegistry } from "libraries/LibListingRegistry.sol";

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
  using SafeCastLib for int256;
  using SafeCastLib for uint32;
  using SafeCastLib for uint256;

  /// @notice processes a buy for amt of item from a listing to an account
  function buy(
    IUintComp comps,
    uint256 id,
    uint256 accID,
    uint32 itemIndex,
    uint256 amt
  ) internal returns (uint32 currencyIndex, uint256 price) {
    price = calcBuyPrice(comps, id, amt);
    if (price == 0) revert("LibListing: invalid buy price");
    incBalance(comps, id, amt);

    // move items
    currencyIndex = LibRegistry.getCurrencyIndex(comps, id);
    LibInventory.incFor(comps, accID, itemIndex, amt); // gain item
    LibInventory.decFor(comps, accID, currencyIndex, price); // take currency
  }

  /// @notice processes a sell for amt of item from an account to a listing
  function sell(
    IUintComp comps,
    uint256 id,
    uint256 accID,
    uint32 itemIndex,
    uint256 amt
  ) internal returns (uint32 currencyIndex, uint256 price) {
    price = calcSellPrice(comps, id, amt);
    if (price == 0) revert("LibListing: invalid sell price");
    decBalance(comps, id, amt);

    // move items
    currencyIndex = LibRegistry.getCurrencyIndex(comps, id);
    LibInventory.decFor(comps, accID, itemIndex, amt); // take item
    LibInventory.incFor(comps, accID, currencyIndex, price); // gain currency
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
    uint256 requirementAnchor = LibRegistry.genReqAnchor(id);
    uint256[] memory requirements = LibConditional.queryFor(comps, requirementAnchor);
    return LibConditional.check(comps, requirements, accID);
  }

  /////////////////
  // CALCULATIONS

  // calculate the buy price from the listing entity
  // NOTE: it's possible we want to consolidate the conditional block into
  // a single calcPrice() at some point. this would allow us to combine
  // overlapping cases and target arbitrary entities with SCALE types
  function calcBuyPrice(
    IUintComp comps,
    uint256 id,
    uint256 amt
  ) internal view returns (uint256 price) {
    if (amt == 0) return 0;
    uint256 buyID = LibRegistry.genBuyID(id);
    string memory type_ = TypeComponent(getAddrByID(comps, TypeCompID)).get(buyID);
    if (type_.eq("FIXED")) {
      return IUintComp(getAddrByID(comps, ValueCompID)).safeGet(id) * amt;
    } else if (type_.eq("GDA")) {
      GDAParams memory params = GDAParams(
        ValueComponent(getAddrByID(comps, ValueCompID)).safeGet(id),
        TimeStartComponent(getAddrByID(comps, TimeStartCompID)).safeGet(id),
        PeriodComponent(getAddrByID(comps, PeriodCompID)).get(buyID).toUint256(),
        DecayComponent(getAddrByID(comps, DecayCompID)).get(buyID).toUint256() * 1e12,
        RateComponent(getAddrByID(comps, RateCompID)).get(buyID),
        BalanceComponent(getAddrByID(comps, BalanceCompID)).safeGet(id).toUint256(),
        amt
      );
      int256 costWad = LibGDA.calc(params);
      require(costWad > 0, "LibListing: non-positive GDA cost");
      return (uint256(costWad) + 1e18 - 1) / 1e18; // round up
    } else revert("LibListing: invalid buy type");
  }

  // calculate the sell price from the listing entity
  // NOTE: scaled pricing is defined with 3 degrees of precision
  function calcSellPrice(
    IUintComp comps,
    uint256 id,
    uint256 amt
  ) internal view returns (uint256 price) {
    uint256 sellID = LibRegistry.genSellID(id);
    string memory type_ = TypeComponent(getAddrByID(comps, TypeCompID)).get(sellID);
    if (type_.eq("FIXED")) {
      return IUintComp(getAddrByID(comps, ValueCompID)).safeGet(id) * amt;
    } else if (type_.eq("SCALED")) {
      int32 scale = ScaleComponent(getAddrByID(comps, ScaleCompID)).get(sellID);
      return (calcBuyPrice(comps, id, amt) * scale.toUint256()) / 1e9;
    } else revert("LibListing: invalid sell type");
  }

  //////////////////
  // SETTERS

  /// @notice increase the balance of a listing by certain amount
  /// @dev how balance is interpreted depends on the type of listing
  function incBalance(IUintComp comps, uint256 id, uint256 amtRaw) internal {
    BalanceComponent(getAddrByID(comps, BalanceCompID)).inc(id, amtRaw.toInt32());
  }

  /// @notice increase the balance of a listing by certain amount
  /// @dev how balance is interpreted depends on the type of listing
  function decBalance(IUintComp comps, uint256 id, uint256 amtRaw) internal {
    BalanceComponent(getAddrByID(comps, BalanceCompID)).dec(id, amtRaw.toInt32());
  }

  ///////////////////
  // LOGGING

  struct LogData {
    uint32 npc;
    uint32 item;
    uint32 amt;
    uint32 currency;
    uint256 cost;
  }

  /// @notice log increase for item buy
  function logBuy(IWorld world, IUintComp comps, uint256 accID, LogData memory data) internal {
    uint32[] memory indices = new uint32[](2);
    indices[1] = data.item;
    string[] memory types = new string[](2);
    types[0] = "LISTING_BUY_TOTAL";
    types[1] = "LISTING_BUY";

    LibData.inc(comps, accID, indices, types, data.amt.toInt256().toUint256());
    LibData.inc(comps, accID, data.currency, "ITEM_SPEND", data.cost);
    LibEmitter.emitEvent(
      world,
      "LISTING_BUY",
      eventSchema(),
      abi.encode(accID, data.npc, data.item, data.amt, data.currency, data.cost)
    );
  }

  /// @notice log increase for item sell
  function logSell(IWorld world, IUintComp comps, uint256 accID, LogData memory data) internal {
    uint32[] memory indices = new uint32[](2);
    indices[1] = data.item;
    string[] memory types = new string[](2);
    types[0] = "LISTING_SELL_TOTAL";
    types[1] = "LISTING_SELL";

    LibData.inc(comps, accID, indices, types, data.amt.toInt256().toUint256());
    LibData.inc(comps, accID, data.currency, "ITEM_REVENUE", data.cost);
    LibEmitter.emitEvent(
      world,
      "LISTING_SELL",
      eventSchema(),
      abi.encode(accID, data.npc, data.item, data.amt, data.currency, data.cost)
    );
  }

  function eventSchema() internal pure returns (uint8[] memory) {
    uint8[] memory _schema = new uint8[](6);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256); // accID
    _schema[1] = uint8(LibTypes.SchemaValue.UINT32); // npc
    _schema[2] = uint8(LibTypes.SchemaValue.UINT32); // item
    _schema[3] = uint8(LibTypes.SchemaValue.UINT32); // amt
    _schema[4] = uint8(LibTypes.SchemaValue.UINT32); // currency
    _schema[5] = uint8(LibTypes.SchemaValue.UINT256); // cost
    return _schema;
  }
}
