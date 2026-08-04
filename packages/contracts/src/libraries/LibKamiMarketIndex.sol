// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { getAddrByID } from "solecs/utils.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";

import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { IDOwnsKamiOrderComponent, ID as IDOwnsKamiOrderCompID } from "components/IDOwnsKamiOrderComponent.sol";
import { IndexKamiComponent, ID as IndexKamiCompID } from "components/IndexKamiComponent.sol";
import { IndexKamiListingComponent, ID as IndexKamiListingCompID } from "components/IndexKamiListingComponent.sol";
import { MaxComponent, ID as MaxCompID } from "components/MaxComponent.sol";
import { TimeEndComponent, ID as TimeEndCompID } from "components/TimeEndComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { ValuesComponent, ID as ValuesCompID } from "components/ValuesComponent.sol";

/// @dev holds uint256[] of listing IDs not yet filled/cancelled — feeds
///      floor-derived pricing (newbie vendor); expired entries filtered on read
uint256 constant ACTIVE_LISTING_INDEX_ENTITY = uint256(keccak256("kami.market.listing.index"));

/// @dev caps the O(N) index rewrites and the vendor's in-tx floor scan so they
///      stay well under Yominet's 4.5M per-tx lane gas cap (~15-20k gas per
///      entry in calcPrice). Listings beyond the cap still exist and trade —
///      they are just invisible to floor pricing until a rebuild re-syncs them.
uint256 constant MAX_ACTIVE_LISTING_INDEX = 100;

/// @dev Deployed (linked) library — consumers reach it via delegatecall, keeping
///      the order-teardown code out of system bytecode: KamiMarketAcceptOfferSystem
///      sits at the EIP-170 limit, which Yominet enforces on-chain.
///      Runs in the calling system's context, so component writer-auth is unchanged.
library LibKamiMarketIndex {
  /// @notice Append a listing to the active-listing index
  /// @dev at the cap the listing is skipped, never rejected — a full index must
  ///      degrade floor pricing, not brick listing creation
  function add(IUintComp comps, uint256 id) public {
    ValuesComponent comp = ValuesComponent(getAddrByID(comps, ValuesCompID));
    uint256[] memory cur = comp.has(ACTIVE_LISTING_INDEX_ENTITY)
      ? comp.get(ACTIVE_LISTING_INDEX_ENTITY)
      : new uint256[](0);
    if (cur.length >= MAX_ACTIVE_LISTING_INDEX) return;
    uint256[] memory next = new uint256[](cur.length + 1);
    for (uint256 i; i < cur.length; i++) next[i] = cur[i];
    next[cur.length] = id;
    comp.set(ACTIVE_LISTING_INDEX_ENTITY, next);
  }

  /// @notice Remove settled/cancelled order state: index entry + queryable components
  /// @dev index removal is a tolerant no-op when id is absent (offers, pre-index listings)
  function cleanup(IUintComp comps, uint256 id) public {
    ValuesComponent valuesComp = ValuesComponent(getAddrByID(comps, ValuesCompID));
    if (valuesComp.has(ACTIVE_LISTING_INDEX_ENTITY)) {
      uint256[] memory cur = valuesComp.get(ACTIVE_LISTING_INDEX_ENTITY);
      for (uint256 i; i < cur.length; i++) {
        if (cur[i] != id) continue;
        uint256[] memory next = new uint256[](cur.length - 1);
        for (uint256 j; j < i; j++) next[j] = cur[j];
        for (uint256 j = i + 1; j < cur.length; j++) next[j - 1] = cur[j];
        valuesComp.set(ACTIVE_LISTING_INDEX_ENTITY, next);
        break;
      }
    }

    IDOwnsKamiOrderComponent(getAddrByID(comps, IDOwnsKamiOrderCompID)).remove(id);

    // conditionally remove optional components
    IndexKamiComponent indexComp = IndexKamiComponent(getAddrByID(comps, IndexKamiCompID));
    if (indexComp.has(id)) indexComp.remove(id);

    IndexKamiListingComponent listingIndexComp = IndexKamiListingComponent(getAddrByID(comps, IndexKamiListingCompID));
    if (listingIndexComp.has(id)) listingIndexComp.remove(id);

    ValueComponent(getAddrByID(comps, ValueCompID)).remove(id);

    TimeStartComponent(getAddrByID(comps, TimeStartCompID)).remove(id);

    TimeEndComponent timeEndComp = TimeEndComponent(getAddrByID(comps, TimeEndCompID));
    if (timeEndComp.has(id)) timeEndComp.remove(id);

    BalanceComponent balComp = BalanceComponent(getAddrByID(comps, BalanceCompID));
    if (balComp.has(id)) balComp.remove(id);

    MaxComponent maxComp = MaxComponent(getAddrByID(comps, MaxCompID));
    if (maxComp.has(id)) maxComp.remove(id);
  }
}
