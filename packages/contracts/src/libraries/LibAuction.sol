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
import { LimitComponent, ID as LimitCompID } from "components/LimitComponent.sol";
import { ScaleComponent, ID as ScaleCompID } from "components/ScaleComponent.sol";
import { TimeResetComponent, ID as TimeResetCompID } from "components/TimeResetComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibAuctionRegistry } from "libraries/LibAuctionRegistry.sol";
import { LibConditional } from "libraries/LibConditional.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibGDA, Params as GDAParams, CompoundParams as GDACompoundParams } from "libraries/utils/LibGDA.sol";

/// @notice a library for interacting with dedicated auctions
/// @dev see LibAuctionRegistry for shape documentation
library LibAuction {
  using SafeCastLib for int32;

  function buy(IUintComp comps, uint256 id, uint256 accID, uint256 amt) internal returns (uint256) {
    uint256 cost = calcBuy(comps, id, amt);
    uint32 itemIndex = IndexComponent(getAddrByID(comps, IndexCompID)).get(id);
    uint32 payItemIndex = IndexItemComponent(getAddrByID(comps, IndexItemCompID)).get(id);
    LibInventory.decFor(comps, accID, payItemIndex, cost);
    LibInventory.incFor(comps, accID, itemIndex, amt);
    return cost;
  }

  // caculate the buy price for a specified quatity from an auction
  function calcBuy(IUintComp comps, uint256 id, uint256 amt) internal view returns (uint256) {
    GDAParams memory params = GDAParams(
      ValueComponent(getAddrByID(comps, ValueCompID)).get(id),
      TimeResetComponent(getAddrByID(comps, TimeResetCompID)).get(id),
      int256(ScaleComponent(getAddrByID(comps, ScaleCompID)).get(id)) * 1e9,
      int256(DecayComponent(getAddrByID(comps, DecayCompID)).get(id)) * 1e9,
      BalanceComponent(getAddrByID(comps, BalanceCompID)).get(id).toUint256(),
      amt
    );

    int256 costWad = LibGDA.calc(params);
    require(costWad > 0, "LibAuction: negative GDA cost");
    return (uint256(costWad) + 1e18 - 1) / 1e18; // round up
  }

  function checkRequirements(
    IUintComp comps,
    uint256 id,
    uint256 accID
  ) internal view returns (bool) {
    uint256[] memory requirements = LibAuctionRegistry.getReqs(comps, id);
    return LibConditional.check(comps, requirements, accID);
  }

  // check whether the auction should be reset
  function shouldReset(IUintComp comps, uint256 id) internal view returns (bool) {
    GDACompoundParams memory params = GDACompoundParams(
      ValueComponent(getAddrByID(comps, ValueCompID)).get(id),
      int256(ScaleComponent(getAddrByID(comps, ScaleCompID)).get(id)) * 1e9,
      BalanceComponent(getAddrByID(comps, BalanceCompID)).get(id).toUint256()
    );
    return LibGDA.calcCompound(params) > 1e72;
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
