// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
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

import { LibConditional, Condition } from "libraries/LibConditional.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";

struct Params {
  uint32 itemIndex;
  uint32 payItemIndex; // the payment item accepted by the auction
  uint32 priceTarget; // the target price of the auction
  int32 period; // reference duration period (in seconds)
  int32 decay; // price decay per period
  int32 rate; // number of purchases per period to counteract decay
  int32 max; // total quantity auctioned
}

/// @notice LibAuction is for the handling of dedicated item auctions in game.
/// Dedicated item auctions are those that are global, not merchant run.
/// Assume, for now, all auctions are implemented as Discrete GDAs.
/// SHAPE:
///  - EntityType: AUCTION
///  - Index: the index of the item being auctioned
///  - ItemIndex: the Payment item index of the auction
///  - Value: the target price of the auction
///  - Balance: the number of sales since the last reset
///  - TimeReset: the time the auction was last reset
///  - Limit: the total amount of the auctioned item
///  - Scale: the scale factor of the GDA
///  - Decay: the decay constant of the GDA
///  - (Requirement)[]

library LibAuctionRegistry {
  using SafeCastLib for int32;

  // create a global item auction
  function create(IUintComp comps, Params memory params) internal returns (uint256) {
    uint256 id = genID(params.itemIndex);
    LibEntityType.set(comps, id, "AUCTION");
    IndexComponent(getAddrByID(comps, IndexCompID)).set(id, params.itemIndex);
    IndexItemComponent(getAddrByID(comps, IndexItemCompID)).set(id, params.payItemIndex);
    ValueComponent(getAddrByID(comps, ValueCompID)).set(id, params.priceTarget);
    MaxComponent(getAddrByID(comps, MaxCompID)).set(id, params.max.toUint256());
    PeriodComponent(getAddrByID(comps, PeriodCompID)).set(id, params.period);
    DecayComponent(getAddrByID(comps, DecayCompID)).set(id, params.decay);
    RateComponent(getAddrByID(comps, RateCompID)).set(id, params.rate.toUint256());
    TimeStartComponent(getAddrByID(comps, TimeStartCompID)).set(id, block.timestamp);
    BalanceComponent(getAddrByID(comps, BalanceCompID)).set(id, 0);
    return id;
  }

  // remove an auction
  function remove(IUintComp comps, uint256 id) internal {
    uint32 index = IndexComponent(getAddrByID(comps, IndexCompID)).get(id);

    LibEntityType.remove(comps, id);
    IndexComponent(getAddrByID(comps, IndexCompID)).remove(id);
    IndexItemComponent(getAddrByID(comps, IndexItemCompID)).remove(id);
    ValueComponent(getAddrByID(comps, ValueCompID)).remove(id);
    MaxComponent(getAddrByID(comps, MaxCompID)).remove(id);
    PeriodComponent(getAddrByID(comps, PeriodCompID)).remove(id);
    DecayComponent(getAddrByID(comps, DecayCompID)).remove(id);
    RateComponent(getAddrByID(comps, RateCompID)).remove(id);
    TimeStartComponent(getAddrByID(comps, TimeStartCompID)).remove(id);
    BalanceComponent(getAddrByID(comps, BalanceCompID)).remove(id);

    uint256[] memory reqs = getReqsByIndex(comps, index);
    for (uint256 i; i < reqs.length; i++) LibConditional.remove(comps, reqs[i]);
  }

  // create a requirement for the auction
  function addRequirement(
    IWorld world,
    IUintComp comps,
    uint256 id,
    Condition memory data
  ) internal {
    LibConditional.createFor(world, comps, data, genReqAnchor(id));
  }

  /////////////////
  // CHECKERS

  // check whether an entity is an auction
  function isInstance(IUintComp comps, uint256 id) internal view returns (bool) {
    return LibEntityType.isShape(comps, id, "AUCTION");
  }

  /////////////////
  // GETTERS

  // gets an item listing from a merchant by its indices
  function get(IUintComp comps, uint32 index) internal view returns (uint256 result) {
    uint256 id = genID(index);
    return isInstance(comps, id) ? id : 0;
  }

  function getReqs(IUintComp comps, uint256 id) internal view returns (uint256[] memory) {
    return LibConditional.queryFor(comps, genReqAnchor(id));
  }

  // get requirements by Auction (Item) Index
  function getReqsByIndex(IUintComp comps, uint32 index) internal view returns (uint256[] memory) {
    uint256 id = genID(index);
    return getReqs(comps, id);
  }

  /////////////////
  // UTILS

  function genID(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("auction", index)));
  }

  function genReqAnchor(uint256 auctionID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("auction.requirement", auctionID)));
  }
}
