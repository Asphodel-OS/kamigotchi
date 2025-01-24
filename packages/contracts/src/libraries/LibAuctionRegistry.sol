// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddrByID } from "solecs/utils.sol";

import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { ItemIndexComponent, ID as ItemIndexCompID } from "components/ItemIndexComponent.sol";
import { DecayComponent, ID as DecayCompID } from "components/DecayComponent.sol";
import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { TimeResetComponent, ID as TimeResetCompID } from "components/TimeResetComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { LimitComponent, ID as LimitCompID } from "components/LimitComponent.sol";
import { ScaleComponent, ID as ScaleCompID } from "components/ScaleComponent.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibConditional } from "libraries/LibConditional.sol";

struct Params {
  uint32 itemIndex;
  uint32 payItemIndex; // the payment item accepted by the auction
  uint32 priceTarget; // the target price of the auction
  int32 limit; // the total left to auction
  int32 decay; // decay constant of the GDA
  int32 scale; // scale factor of the GDA
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
  // create a global item auction
  function create(IUintComp comps, Params memory params) internal returns (uint256) {
    uint256 id = genID(params.itemIndex);
    LibEntityType.set(comps, id, "AUCTION");
    IndexComponent(getAddrByID(comps, IndexCompID)).set(id, params.itemIndex);
    ItemIndexComponent(getAddrByID(comps, ItemIndexCompID)).set(id, params.payItemIndex);
    ValueComponent(getAddrByID(comps, ValueCompID)).set(id, params.priceTarget);
    LimitComponent(getAddrByID(comps, LimitCompID)).set(id, params.limit);
    ScaleComponent(getAddrByID(comps, ScaleCompID)).set(id, params.scale);
    DecayComponent(getAddrByID(comps, DecayCompID)).set(id, params.decay);
    TimeResetComponent(getAddrByID(comps, TimeResetCompID)).set(id, block.timestamp);
    TimeStartComponent(getAddrByID(comps, TimeStartCompID)).set(id, block.timestamp);
    BalanceComponent(getAddrByID(comps, BalanceCompID)).set(id, 0);
    return id;
  }

  // remove an auction
  function remove(IUintComp comps, uint256 id) internal {
    uint32 index = IndexComponent(getAddrByID(comps, IndexCompID)).get(id);

    LibEntityType.remove(comps, id);
    IndexComponent(getAddrByID(comps, IndexCompID)).remove(id);
    ItemIndexComponent(getAddrByID(comps, ItemIndexCompID)).remove(id);
    ValueComponent(getAddrByID(comps, ValueCompID)).remove(id);
    LimitComponent(getAddrByID(comps, LimitCompID)).remove(id);
    ScaleComponent(getAddrByID(comps, ScaleCompID)).remove(id);
    DecayComponent(getAddrByID(comps, DecayCompID)).remove(id);
    TimeResetComponent(getAddrByID(comps, TimeResetCompID)).remove(id);
    TimeStartComponent(getAddrByID(comps, TimeStartCompID)).remove(id);
    BalanceComponent(getAddrByID(comps, BalanceCompID)).remove(id);

    uint256[] memory reqs = getReqsByIndex(components, index);
    for (uint256 i; i < reqs.length; i++) LibConditional.remove(components, reqs[i]);
  }

  // reset the auction to an updated value (resets time and balance tracking)
  function reset(IUintComp comps, uint256 id, uint256 priceTarget) internal {
    int32 limit = LimitComponent(getAddrByID(comps, LimitCompID)).get(id);
    int32 balance = BalanceComponent(getAddrByID(comps, BalanceCompID)).get(id);
    LimitComponent(getAddrByID(comps, LimitCompID)).set(id, limit - balance);
    BalanceComponent(getAddrByID(components, BalanceCompID)).set(id, 0);
    ValueComponent(getAddrByID(components, ValueCompID)).set(id, priceTarget);
    TimeResetComponent(getAddrByID(components, TimeResetCompID)).set(id, block.timestamp);
  }

  // create a requirement for the auction
  function addRequirement(IUintComp comps, uint256 index, Condition memory data) internal {
    LibConditional.createFor(world, comps, data, genReqAnchor(index));
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

  // get requirements by Auction (Item) Index
  function getReqsByIndex(
    IUintComp components,
    uint32 index
  ) internal view returns (uint256[] memory) {
    return LibConditional.queryFor(components, genReqAnchor(index));
  }

  /////////////////
  // UTILS

  function genID(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("auction", index)));
  }

  function genReqAnchor(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("auction.requirement", index)));
  }
}
