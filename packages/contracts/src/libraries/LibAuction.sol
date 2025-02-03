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
import { TimeResetComponent, ID as TimeResetCompID } from "components/TimeResetComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibAuctionRegistry } from "libraries/LibAuctionRegistry.sol";
import { LibConditional } from "libraries/LibConditional.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibGDA, Params2 as GDAParams } from "libraries/utils/LibGDA.sol";

/// @notice a library for interacting with dedicated auctions
/// @dev see LibAuctionRegistry for shape documentation
library LibAuction {
  using SafeCastLib for int32;
  using SafeCastLib for uint32;
  using SafeCastLib for int256;
  using SafeCastLib for uint256;

  function buy(IUintComp comps, uint256 id, uint256 accID, uint32 amt) internal returns (uint256) {
    uint256 cost = calcBuy(comps, id, amt);
    uint32 itemIndex = IndexComponent(getAddrByID(comps, IndexCompID)).get(id);
    uint32 payItemIndex = IndexItemComponent(getAddrByID(comps, IndexItemCompID)).get(id);
    LibInventory.decFor(comps, accID, payItemIndex, cost);
    LibInventory.incFor(comps, accID, itemIndex, amt);
    incBalance(comps, id, amt);
    return cost;
  }

  // TODO: before next world, upgrade int32 comps to use .dec() .inc() like uint256
  function incBalance(IUintComp comps, uint256 id, uint32 amt) internal {
    int32 balance = BalanceComponent(getAddrByID(comps, BalanceCompID)).get(id);
    BalanceComponent(getAddrByID(comps, BalanceCompID)).set(id, balance + amt.toInt32());
  }

  /////////////////
  // CALCS

  // caculate the buy price for a specified quatity from an auction
  function calcBuy(IUintComp comps, uint256 id, uint32 amt) internal view returns (uint256) {
    GDAParams memory params = GDAParams(
      ValueComponent(getAddrByID(comps, ValueCompID)).get(id),
      TimeResetComponent(getAddrByID(comps, TimeResetCompID)).get(id),
      int256(PeriodComponent(getAddrByID(comps, PeriodCompID)).get(id)),
      int256(DecayComponent(getAddrByID(comps, DecayCompID)).get(id)) * 1e12,
      RateComponent(getAddrByID(comps, RateCompID)).get(id).toInt256(),
      BalanceComponent(getAddrByID(comps, BalanceCompID)).get(id).toUint256(),
      amt
    );

    int256 costWad = LibGDA.calcPerpetual(params);
    require(costWad > 0, "LibAuction: negative GDA cost");
    return (uint256(costWad) + 1e18 - 1) / 1e18; // round up
  }

  /////////////////
  // CHECKERS

  // check whether a purchase amount would exceed the balance remaining in the auction
  function exceedsLimit(IUintComp comps, uint256 id, uint32 amt) internal view returns (bool) {
    uint256 limit = MaxComponent(getAddrByID(comps, MaxCompID)).get(id);
    uint256 balance = BalanceComponent(getAddrByID(comps, BalanceCompID)).get(id).toUint256();
    return balance + uint256(amt) > limit;
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
