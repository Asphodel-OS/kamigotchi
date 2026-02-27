// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibTypes } from "solecs/LibTypes.sol";

import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { IDOwnsKamiOrderComponent, ID as IDOwnsKamiOrderCompID } from "components/IDOwnsKamiOrderComponent.sol";
import { IndexKamiComponent, ID as IndexKamiCompID } from "components/IndexKamiComponent.sol";
import { IndexKamiListingComponent, ID as IndexKamiListingCompID } from "components/IndexKamiListingComponent.sol";
import { MaxComponent, ID as MaxCompID } from "components/MaxComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { TimeEndComponent, ID as TimeEndCompID } from "components/TimeEndComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { ID as EntityTypeCompID } from "components/EntityTypeComponent.sol";

import { IComponent } from "solecs/interfaces/IComponent.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibEmitter } from "libraries/utils/LibEmitter.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibData } from "libraries/LibData.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibCooldown } from "libraries/utils/LibCooldown.sol";

import { KamiMarketVault } from "tokens/KamiMarketVault.sol";

/// @title  Library for Kami Marketplace orderbook
/// @notice Handles listings (ETH), offers (WETH), and collection offers (WETH)
library LibKamiMarket {
  using LibComp for IComponent;
  using LibString for string;

  /////////////////
  // CREATE

  /// @notice Create a listing entity — kami stays in seller's wallet
  function createListing(
    IWorld world,
    IUintComp comps,
    uint256 accID,
    uint32 kamiIndex,
    uint256 price,
    uint256 expiry
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    LibEntityType.set(comps, id, "KAMI_LISTING");
    StateComponent(getAddrByID(comps, StateCompID)).set(id, string("ACTIVE"));
    IDOwnsKamiOrderComponent(getAddrByID(comps, IDOwnsKamiOrderCompID)).set(id, accID);
    IndexKamiListingComponent(getAddrByID(comps, IndexKamiListingCompID)).set(id, kamiIndex);
    ValueComponent(getAddrByID(comps, ValueCompID)).set(id, price);
    TimeStartComponent(getAddrByID(comps, TimeStartCompID)).set(id, block.timestamp);
    if (expiry > 0) TimeEndComponent(getAddrByID(comps, TimeEndCompID)).set(id, expiry);
  }

  /// @notice Create a specific offer entity (WETH, approval-based)
  function createOffer(
    IWorld world,
    IUintComp comps,
    uint256 accID,
    uint32 kamiIndex,
    uint256 price,
    uint256 expiry
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    LibEntityType.set(comps, id, "KAMI_OFFER");
    StateComponent(getAddrByID(comps, StateCompID)).set(id, string("ACTIVE"));
    IDOwnsKamiOrderComponent(getAddrByID(comps, IDOwnsKamiOrderCompID)).set(id, accID);
    IndexKamiComponent(getAddrByID(comps, IndexKamiCompID)).set(id, kamiIndex);
    ValueComponent(getAddrByID(comps, ValueCompID)).set(id, price);
    TimeStartComponent(getAddrByID(comps, TimeStartCompID)).set(id, block.timestamp);
    if (expiry > 0) TimeEndComponent(getAddrByID(comps, TimeEndCompID)).set(id, expiry);
  }

  /// @notice Create a collection offer entity (WETH, approval-based)
  function createCollectionOffer(
    IWorld world,
    IUintComp comps,
    uint256 accID,
    uint256 pricePerKami,
    uint32 quantity,
    uint256 expiry
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    LibEntityType.set(comps, id, "KAMI_COLLECTION_OFFER");
    StateComponent(getAddrByID(comps, StateCompID)).set(id, string("ACTIVE"));
    IDOwnsKamiOrderComponent(getAddrByID(comps, IDOwnsKamiOrderCompID)).set(id, accID);
    ValueComponent(getAddrByID(comps, ValueCompID)).set(id, pricePerKami);
    BalanceComponent(getAddrByID(comps, BalanceCompID)).set(id, int32(uint32(quantity)));
    MaxComponent(getAddrByID(comps, MaxCompID)).set(id, uint256(quantity));
    TimeStartComponent(getAddrByID(comps, TimeStartCompID)).set(id, block.timestamp);
    if (expiry > 0) TimeEndComponent(getAddrByID(comps, TimeEndCompID)).set(id, expiry);
  }

  /////////////////
  // FILL

  /// @notice Fill a listing — buyer sends ETH, seller receives ETH minus fee
  /// @dev Kami stays staked. Ownership transferred via IDOwnsKami reassignment.
  /// @return sellerAddress The seller's address for ETH payment
  /// @return price The listing price
  /// @return kamiIndex The kami token index
  function fillListing(
    IUintComp comps,
    uint256 id,
    uint256 buyerAccID
  ) internal returns (address sellerAddress, uint256 price, uint32 kamiIndex) {
    uint256 sellerAccID = getOwner(comps, id);
    sellerAddress = LibAccount.getOwner(comps, sellerAccID);
    price = getPrice(comps, id);
    kamiIndex = getListingKamiIndex(comps, id);

    uint256 kamiID = LibKami.getByIndex(comps, kamiIndex);

    // verify kami is still listed and seller still owns via IDOwnsKami
    LibKami.verifyState(comps, kamiID, "LISTED");
    LibKami.verifyAccount(comps, kamiID, sellerAccID);

    // reassign ownership and restore state
    LibKami.setOwner(comps, kamiID, buyerAccID);
    LibKami.setState(comps, kamiID, "RESTING");
    _setPurchaseCooldown(comps, kamiID);

    // mark filled and clean up
    _markFilled(comps, id);
  }

  /// @notice Fill a specific offer — WETH pulled from buyer, kami reassigned via IDOwnsKami
  function fillOffer(
    IWorld world,
    IUintComp comps,
    uint256 id,
    uint256 sellerAccID
  ) internal returns (address buyerAddress, uint256 price, uint32 kamiIndex) {
    uint256 buyerAccID = getOwner(comps, id);
    buyerAddress = LibAccount.getOwner(comps, buyerAccID);
    price = getPrice(comps, id);
    kamiIndex = getKamiIndex(comps, id);

    uint256 kamiID = LibKami.getByIndex(comps, kamiIndex);

    // if kami is listed, cancel listings first
    _cancelListingsIfListed(world, comps, kamiIndex);

    // reassign ownership and set RESTING
    LibKami.setOwner(comps, kamiID, buyerAccID);
    LibKami.setState(comps, kamiID, "RESTING");
    _setPurchaseCooldown(comps, kamiID);

    // mark filled and clean up
    _markFilled(comps, id);
  }

  /// @notice Fill one unit of a collection offer
  function fillCollectionOffer(
    IWorld world,
    IUintComp comps,
    uint256 id,
    uint256 sellerAccID,
    uint32 kamiIndex
  ) internal returns (address buyerAddress, uint256 price) {
    uint256 buyerAccID = getOwner(comps, id);
    buyerAddress = LibAccount.getOwner(comps, buyerAccID);
    price = getPrice(comps, id);

    uint256 kamiID = LibKami.getByIndex(comps, kamiIndex);

    // if kami is listed, cancel listings first
    _cancelListingsIfListed(world, comps, kamiIndex);

    // reassign ownership and set RESTING
    LibKami.setOwner(comps, kamiID, buyerAccID);
    LibKami.setState(comps, kamiID, "RESTING");
    _setPurchaseCooldown(comps, kamiID);

    // decrement balance
    BalanceComponent balComp = BalanceComponent(getAddrByID(comps, BalanceCompID));
    int32 remaining = balComp.get(id) - 1;
    balComp.set(id, remaining);

    if (remaining == 0) {
      _markFilled(comps, id);
    }
  }

  /////////////////
  // CANCEL

  /// @notice Cancel a listing — restore kami state if still listed
  function cancelListing(IUintComp comps, uint256 id) internal {
    uint32 kamiIndex = getListingKamiIndex(comps, id);
    uint256 kamiID = LibKami.getByIndex(comps, kamiIndex);

    // only restore state if kami is still LISTED (may be stale if offer was accepted)
    if (LibKami.isState(comps, kamiID, "LISTED")) {
      LibKami.setState(comps, kamiID, "RESTING");
    }

    _markCancelled(comps, id);
  }

  /// @notice Cancel all active listings for a kami index (used on transfer/bridge)
  /// @dev Only runs if kami is still in LISTED state — prevents double-cancel in fill flows
  /// @dev Listing lookup is owner-agnostic so transferred listings can still be cancelled.
  function cancelListingsForKami(IWorld world, IUintComp comps, uint32 kamiIndex) internal {
    uint256 kamiID = LibKami.getByIndex(comps, kamiIndex);
    if (!LibKami.isState(comps, kamiID, "LISTED")) return;

    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(
      QueryType.HasValue,
      IComponent(getAddrByID(comps, IndexKamiListingCompID)),
      abi.encode(kamiIndex)
    );
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      IComponent(getAddrByID(comps, EntityTypeCompID)),
      abi.encode("KAMI_LISTING")
    );

    uint256[] memory orders = LibQuery.query(fragments);
    if (orders.length == 0) revert("KamiMarket: listing index missing");

    for (uint256 i; i < orders.length; i++) {
      uint256 accID = getOwner(comps, orders[i]);
      cancelListing(comps, orders[i]);
      emitCancel(world, orders[i], accID);
      logCancel(comps, accID);
    }
  }

  /// @notice Cancel an offer or collection offer — no kami/WETH to return
  function cancelOffer(IUintComp comps, uint256 id) internal {
    _markCancelled(comps, id);
  }

  /////////////////
  // INTERNAL HELPERS

  /// @notice If kami is LISTED, cancel all its listings before transfer
  function _cancelListingsIfListed(IWorld world, IUintComp comps, uint32 kamiIndex) internal {
    uint256 kamiID = LibKami.getByIndex(comps, kamiIndex);
    if (LibKami.isState(comps, kamiID, "LISTED")) {
      cancelListingsForKami(world, comps, kamiIndex);
    }
  }

  /// @notice Apply post-purchase cooldown (defaults to 1 hour if not configured)
  function _setPurchaseCooldown(IUintComp comps, uint256 kamiID) internal {
    uint256 cd = LibConfig.has(comps, "KAMI_MARKET_PURCHASE_COOLDOWN")
      ? LibConfig.get(comps, "KAMI_MARKET_PURCHASE_COOLDOWN")
      : 3600;
    if (cd > 0) LibCooldown.modify(comps, kamiID, int256(cd));
  }

  /////////////////
  // CLEANUP

  function _markFilled(IUintComp comps, uint256 id) internal {
    StateComponent(getAddrByID(comps, StateCompID)).set(id, string("FILLED"));
    _cleanup(comps, id);
  }

  function _markCancelled(IUintComp comps, uint256 id) internal {
    StateComponent(getAddrByID(comps, StateCompID)).set(id, string("CANCELLED"));
    _cleanup(comps, id);
  }

  /// @notice Remove indexed/queryable components after order is settled
  function _cleanup(IUintComp comps, uint256 id) internal {
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

  /////////////////
  // FEE CALCULATION

  /// @notice Calculate fee from price using configured rate array
  /// @dev Rate array format: [precision, numerator, ...] → fee = price * numerator / 10^precision
  function calcFee(IUintComp comps, uint256 price) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(comps, "KAMI_MARKET_FEE_RATE");
    return (price * config[1]) / (10 ** config[0]);
  }

  /////////////////
  // CHECKERS

  function verifyIsType(IUintComp comps, uint256 id, string memory type_) internal view {
    if (!LibEntityType.isShape(comps, id, type_)) revert("KamiMarket: wrong order type");
  }

  function verifyActive(IUintComp comps, uint256 id) internal view {
    if (!getCompByID(comps, StateCompID).eqString(id, "ACTIVE")) {
      revert("KamiMarket: order not active");
    }
  }

  function verifyNotExpired(IUintComp comps, uint256 id) internal view {
    TimeEndComponent timeEndComp = TimeEndComponent(getAddrByID(comps, TimeEndCompID));
    if (timeEndComp.has(id)) {
      if (block.timestamp > timeEndComp.get(id)) revert("KamiMarket: order expired");
    }
  }

  function verifyOwner(IUintComp comps, uint256 id, uint256 accID) internal view {
    if (getOwner(comps, id) != accID) revert("KamiMarket: not order owner");
  }

  function verifyNotOwner(IUintComp comps, uint256 id, uint256 accID) internal view {
    if (getOwner(comps, id) == accID) revert("KamiMarket: cannot self-trade");
  }

  function verifyCollectionOfferQuantity(IUintComp comps, uint256 id, uint256 count) internal view {
    int32 remaining = BalanceComponent(getAddrByID(comps, BalanceCompID)).get(id);
    require(uint32(remaining) >= count, "KamiMarket: insufficient quantity");
  }


  /// @notice Verify kami exists, is RESTING, and owned by accID
  function verifyKamiResting(IUintComp comps, uint32 kamiIndex, uint256 accID) internal view {
    uint256 kamiID = LibKami.getByIndex(comps, kamiIndex);
    if (kamiID == 0) revert("KamiMarket: kami not found");
    LibKami.verifyState(comps, kamiID, "RESTING");
    LibKami.verifyAccount(comps, kamiID, accID);
  }

  /// @notice Verify kami exists, is RESTING or LISTED, and owned by accID
  function verifyKamiOwnedRestingOrListed(IUintComp comps, uint32 kamiIndex, uint256 accID) internal view {
    uint256 kamiID = LibKami.getByIndex(comps, kamiIndex);
    if (kamiID == 0) revert("KamiMarket: kami not found");
    if (!LibKami.isState(comps, kamiID, "RESTING") && !LibKami.isState(comps, kamiID, "LISTED")) {
      revert("KamiMarket: kami not available");
    }
    LibKami.verifyAccount(comps, kamiID, accID);
  }

  function verifyEnabled(IUintComp comps) internal view {
    if (!LibConfig.getBool(comps, "KAMI_MARKET_ENABLED")) revert("KamiMarket: disabled");
  }

  /////////////////
  // GETTERS

  function getOwner(IUintComp comps, uint256 id) internal view returns (uint256) {
    return IDOwnsKamiOrderComponent(getAddrByID(comps, IDOwnsKamiOrderCompID)).get(id);
  }

  function getPrice(IUintComp comps, uint256 id) internal view returns (uint256) {
    return ValueComponent(getAddrByID(comps, ValueCompID)).get(id);
  }

  function getKamiIndex(IUintComp comps, uint256 id) internal view returns (uint32) {
    return IndexKamiComponent(getAddrByID(comps, IndexKamiCompID)).get(id);
  }

  function getListingKamiIndex(IUintComp comps, uint256 id) internal view returns (uint32) {
    return IndexKamiListingComponent(getAddrByID(comps, IndexKamiListingCompID)).get(id);
  }


  function getVault(IUintComp comps) internal view returns (KamiMarketVault) {
    return KamiMarketVault(LibConfig.getAddress(comps, "KAMI_MARKET_VAULT"));
  }

  function getFeeRecipient(IUintComp comps) internal view returns (address) {
    return LibConfig.getAddress(comps, "KAMI_MARKET_FEE_RECIPIENT");
  }

  /////////////////
  // LOGGING

  function logList(IUintComp comps, uint256 accID) internal {
    LibData.inc(comps, accID, 0, "KAMI_MARKET_LIST", 1);
  }

  function logBuy(IUintComp comps, uint256 accID) internal {
    LibData.inc(comps, accID, 0, "KAMI_MARKET_BUY", 1);
  }

  function logOffer(IUintComp comps, uint256 accID) internal {
    LibData.inc(comps, accID, 0, "KAMI_MARKET_OFFER", 1);
  }

  function logAcceptOffer(IUintComp comps, uint256 accID) internal {
    LibData.inc(comps, accID, 0, "KAMI_MARKET_ACCEPT", 1);
  }

  function logCancel(IUintComp comps, uint256 accID) internal {
    LibData.inc(comps, accID, 0, "KAMI_MARKET_CANCEL", 1);
  }

  /////////////////
  // EVENT EMISSION

  function emitList(
    IWorld world,
    uint256 orderID,
    uint256 accID,
    uint32 kamiIndex,
    uint256 price,
    uint256 expiry
  ) internal {
    uint8[] memory _schema = new uint8[](5);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256);
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256);
    _schema[2] = uint8(LibTypes.SchemaValue.UINT32);
    _schema[3] = uint8(LibTypes.SchemaValue.UINT256);
    _schema[4] = uint8(LibTypes.SchemaValue.UINT256);
    LibEmitter.emitEvent(world, "KAMI_MARKET_LIST", _schema, abi.encode(orderID, accID, kamiIndex, price, expiry));
  }

  function emitBuy(
    IWorld world,
    uint256 orderID,
    uint256 buyerAccID,
    uint256 sellerAccID,
    uint32 kamiIndex,
    uint256 price
  ) internal {
    uint8[] memory _schema = new uint8[](5);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256);
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256);
    _schema[2] = uint8(LibTypes.SchemaValue.UINT256);
    _schema[3] = uint8(LibTypes.SchemaValue.UINT32);
    _schema[4] = uint8(LibTypes.SchemaValue.UINT256);
    LibEmitter.emitEvent(world, "KAMI_MARKET_BUY", _schema, abi.encode(orderID, buyerAccID, sellerAccID, kamiIndex, price));
  }

  function emitOffer(
    IWorld world,
    uint256 orderID,
    uint256 accID,
    uint32 kamiIndex,
    uint32 quantity,
    uint256 price,
    uint256 expiry
  ) internal {
    uint8[] memory _schema = new uint8[](6);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256);
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256);
    _schema[2] = uint8(LibTypes.SchemaValue.UINT32);
    _schema[3] = uint8(LibTypes.SchemaValue.UINT32);
    _schema[4] = uint8(LibTypes.SchemaValue.UINT256);
    _schema[5] = uint8(LibTypes.SchemaValue.UINT256);
    LibEmitter.emitEvent(
      world,
      "KAMI_MARKET_OFFER",
      _schema,
      abi.encode(orderID, accID, kamiIndex, quantity, price, expiry)
    );
  }

  function emitAcceptOffer(
    IWorld world,
    uint256 orderID,
    uint256 sellerAccID,
    uint256 buyerAccID,
    uint32 kamiIndex,
    uint256 price
  ) internal {
    uint8[] memory _schema = new uint8[](5);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256);
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256);
    _schema[2] = uint8(LibTypes.SchemaValue.UINT256);
    _schema[3] = uint8(LibTypes.SchemaValue.UINT32);
    _schema[4] = uint8(LibTypes.SchemaValue.UINT256);
    LibEmitter.emitEvent(world, "KAMI_MARKET_ACCEPT", _schema, abi.encode(orderID, sellerAccID, buyerAccID, kamiIndex, price));
  }

  function emitCancel(IWorld world, uint256 orderID, uint256 accID) internal {
    uint8[] memory _schema = new uint8[](2);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256);
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256);
    LibEmitter.emitEvent(world, "KAMI_MARKET_CANCEL", _schema, abi.encode(orderID, accID));
  }
}
