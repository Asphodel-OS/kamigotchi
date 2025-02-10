// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddrByID } from "solecs/utils.sol";

import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { DecayComponent, ID as DecayCompID } from "components/DecayComponent.sol";
import { MaxComponent, ID as MaxCompID } from "components/MaxComponent.sol";
import { PeriodComponent, ID as PeriodCompID } from "components/PeriodComponent.sol";
import { RateComponent, ID as RateCompID } from "components/RateComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibAuctionRegistry } from "libraries/LibAuctionRegistry.sol";
import { LibConditional } from "libraries/LibConditional.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibGDA, Params2 as GDAParams } from "libraries/utils/LibGDA.sol";

/// @notice a library for interacting with dedicated auctions
/// @dev see LibAuctionRegistry for shape documentation
library LibAuction {
  using SafeCastLib for int32;
  using SafeCastLib for int256;
  using SafeCastLib for uint32;
  using SafeCastLib for uint256;

  // TODO: before next world, upgrade int32 comps to use .dec() .inc() like uint256
  function incBalance(IUintComp comps, uint256 id, uint32 amt) internal {
    BalanceComponent balComp = BalanceComponent(getAddrByID(comps, BalanceCompID));
    int32 balance = balComp.get(id);
    balComp.set(id, balance + amt.toInt32());
  }

  /////////////////
  // CALCS

  // caculate the buy price for a specified quatity from an auction
  function calcBuy(IUintComp comps, uint256 id, uint32 amt) internal view returns (uint256) {
    GDAParams memory params = GDAParams(
      ValueComponent(getAddrByID(comps, ValueCompID)).get(id),
      TimeStartComponent(getAddrByID(comps, TimeStartCompID)).get(id),
      PeriodComponent(getAddrByID(comps, PeriodCompID)).get(id).toUint256(),
      DecayComponent(getAddrByID(comps, DecayCompID)).get(id).toUint256() * 1e12,
      RateComponent(getAddrByID(comps, RateCompID)).get(id),
      BalanceComponent(getAddrByID(comps, BalanceCompID)).get(id).toUint256(),
      uint256(amt)
    );

    int256 costWad = LibGDA.calcPerpetual(params);
    require(costWad > 0, "LibAuction: negative GDA cost");
    return (uint256(costWad) + 1e18 - 1) / 1e18; // round up
  }

  /////////////////
  // CHECKERS

  // check whether a purchase amount would exceed the balance remaining in the auction
  function exceedsLimit(IUintComp comps, uint256 id, uint32 amt) internal view returns (bool) {
    uint256 max = MaxComponent(getAddrByID(comps, MaxCompID)).get(id);
    uint256 balance = BalanceComponent(getAddrByID(comps, BalanceCompID)).get(id).toUint256();
    return balance + uint256(amt) > max;
  }

  // check whether the account meets the requirements to participate in an auction
  function meetsRequirements(
    IUintComp comps,
    uint256 id,
    uint256 accID
  ) internal view returns (bool) {
    uint256[] memory requirements = LibAuctionRegistry.getReqs(comps, id);
    return LibConditional.check(comps, requirements, accID);
  }

  // check whether the parameters for a AuctionBuy call are valid
  function verifyBuyParams(
    IUintComp comps,
    uint32 itemIndex,
    uint32 amt
  ) internal view returns (uint256) {
    if (amt < 1) revert("LibAuction: purchase amount must be positive");

    uint256 itemID = LibItem.getByIndex(comps, itemIndex);
    if (itemID == 0) revert("LibAuction: item does not exist");

    uint256 id = LibAuctionRegistry.get(comps, itemIndex);
    if (id == 0) revert("LibAuction: auction does not exist for item index");

    if (exceedsLimit(comps, id, amt)) revert("LibAuction: amount exceeds auction limit");

    return id;
  }

  // check whether the account meets the requirements to interact with an auction
  function verifyRequirements(IUintComp comps, uint256 id, uint256 accID) internal view {
    if (!meetsRequirements(comps, id, accID)) revert("LibAuction: reqs not met");
  }

  /////////////////
  // LOGGING

  // // log a purchase from the auction
  // // accIndex, itemIndex, amt, price?, ts
  // function logBuy(IWorld world, uint256 systemId, bytes memory values) internal {
  //   uint8[] memory _schema = new uint8[](1);
  //   _schema[0] = uint8(LibTypes.SchemaValue.UINT32);
  //   LibEmitter.emitSystemCall(world, systemId, _schema, values);
  // }

  // // log a reset from the auction
  // // value, ts
  // function logReset(IUintComp components, uint256 accID, uint256 amt) internal {
  //   LibData.inc(components, accID, 0, "AUCTION_RESET", amt);
  //   LibEmitter.emitSystemCall(world, systemId, _schema, values);
  // }
}
