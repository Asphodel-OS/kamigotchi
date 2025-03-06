// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IndexNPCComponent, ID as IndexNPCComponentID } from "components/IndexNPCComponent.sol";
import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { DecayComponent, ID as DecayCompID } from "components/DecayComponent.sol";
import { PeriodComponent, ID as PeriodCompID } from "components/PeriodComponent.sol";
import { RateComponent, ID as RateCompID } from "components/RateComponent.sol";
import { ScaleComponent, ID as ScaleCompID } from "components/ScaleComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { Condition, LibConditional } from "libraries/LibConditional.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";

/** @notice
 * LibListingRegistry handles the creation, removal and update of Listing entities
 *
 * Listing entities are shaped as follows:
 *  - EntityType: LISTING
 *  - IndexNPC: the merchant's npc index
 *  - IndexItem: the item index
 *  - Index???: index of item used as currency of exchange
 *  - Value: the target price of the listing (not necessarily the actual price)
 *  - Balance: the number of units bought or sold
 *  - TimeStart: the time the item was created
 *  - Price entities - Buy/Sell
 *
 * Pricing entities: used for buy/sell details
 *  - Type: FIXED | GDA | SCALED
 *    - FIXED: direct read of ValueComp on the actual Listing entity
 *    - GDA: dynamic price calc based the Balance, TimeStart and Value target of the Listing
 *    - SCALED: scaled version of the Buy Side price calc (sell only)
 */
library LibListingRegistry {
  using LibComp for IUintComp;

  ////////////
  // SHAPES

  /// @notice create a merchant listing with the specified parameters
  function create(
    IUintComp comps,
    uint32 npcIndex,
    uint32 itemIndex,
    uint32 currencyIndex, // currency index
    uint256 value // target base price
  ) internal returns (uint256 id) {
    id = genID(npcIndex, itemIndex);
    LibEntityType.set(comps, id, "LISTING");
    IndexNPCComponent(getAddrByID(comps, IndexNPCComponentID)).set(id, npcIndex);
    IndexItemComponent(getAddrByID(comps, IndexItemCompID)).set(id, itemIndex);
    // pay item index
    BalanceComponent(getAddrByID(comps, BalanceCompID)).set(id, 0);
    TimeStartComponent(getAddrByID(comps, TimeStartCompID)).set(id, block.timestamp);
    ValueComponent(getAddrByID(comps, ValueCompID)).set(id, value);
  }

  /// @notice set the buy price of a listing as the Value of the Listing Entity
  function setBuyFixed(IUintComp comps, uint256 id) internal {
    uint256 priceID = genBuyID(id);
    TypeComponent(getAddrByID(comps, TypeCompID)).set(priceID, "FIXED");
  }

  /// @notice set the requisite pricing variables for GDA price
  /// @dev scale: 1e9 precision -- decay: 1e9 precision
  function setBuyGDA(IUintComp comps, uint256 id, int32 period, int32 decay, int32 rate) internal {
    uint256 priceID = genBuyID(id);
    TypeComponent(getAddrByID(comps, TypeCompID)).set(priceID, "GDA");
    PeriodComponent(getAddrByID(comps, PeriodCompID)).set(priceID, period);
    DecayComponent(getAddrByID(comps, DecayCompID)).set(priceID, decay);
    RateComponent(getAddrByID(comps, RateCompID)).set(priceID, rate);
  }

  /// @notice set the sell price of a listing as the Value of the Listing Entity
  function setSellFixed(IUintComp comps, uint256 id, uint32 currency) internal {
    uint256 priceID = genSellID(id);
    TypeComponent(getAddrByID(comps, TypeCompID)).set(priceID, "FIXED");
  }

  /// @notice set the sell price of a listing as a scaled value of the buy price
  /// @dev  scaled pricing is defined with 3 degrees of precision
  /// @dev we ensure interpreted scale within bounds to avoid economic vulns
  function setSellScaled(IUintComp comps, uint256 id, int32 scale) internal {
    uint256 priceID = genSellID(id);
    TypeComponent(getAddrByID(comps, TypeCompID)).set(priceID, "SCALED");
    ScaleComponent(getAddrByID(comps, ScaleCompID)).set(priceID, scale);
  }

  /// @notice create a requirement for a listing
  /// @dev requirements apply equally to buy and sell
  function setRequirement(
    IWorld world,
    IUintComp comps,
    uint256 regID,
    Condition memory data
  ) internal returns (uint256) {
    return LibConditional.createFor(world, comps, data, genReqAnchor(regID));
  }

  /// @notice remove all data associated with a listing
  function remove(IUintComp comps, uint256 id) internal {
    LibEntityType.remove(comps, id);
    IndexNPCComponent(getAddrByID(comps, IndexNPCComponentID)).remove(id);
    IndexItemComponent(getAddrByID(comps, IndexItemCompID)).remove(id);
    BalanceComponent(getAddrByID(comps, BalanceCompID)).remove(id);
    TimeStartComponent(getAddrByID(comps, TimeStartCompID)).remove(id);
    ValueComponent(getAddrByID(comps, ValueCompID)).remove(id);

    removePrice(comps, genBuyID(id));
    removePrice(comps, genSellID(id));

    uint256[] memory requirements = LibConditional.queryFor(comps, genReqAnchor(id));
    for (uint256 i; i < requirements.length; i++) {
      LibConditional.remove(comps, requirements[i]);
    }
  }

  /// @notice clear out the component entries of a pricing entity
  function removePrice(IUintComp comps, uint256 priceID) internal {
    TypeComponent(getAddrByID(comps, TypeCompID)).remove(priceID);
    DecayComponent(getAddrByID(comps, DecayCompID)).remove(priceID);
    PeriodComponent(getAddrByID(comps, PeriodCompID)).remove(priceID);
    RateComponent(getAddrByID(comps, RateCompID)).remove(priceID);
    ScaleComponent(getAddrByID(comps, ScaleCompID)).remove(priceID);
    ValueComponent(getAddrByID(comps, ValueCompID)).remove(priceID);
  }

  /////////////////
  // GETTERS

  // gets an item listing from a merchant by its indices
  function get(
    IUintComp comps,
    uint32 merchantIndex,
    uint32 itemIndex
  ) internal view returns (uint256 result) {
    uint256 id = genID(merchantIndex, itemIndex);
    return LibEntityType.isShape(comps, id, "LISTING") ? id : 0;
  }

  function getBuyCurrency(IUintComp comps, uint256 listingID) internal view returns (uint32) {
    return IndexItemComponent(getAddrByID(comps, IndexItemCompID)).get(genBuyID(listingID));
  }

  function getSellCurrency(IUintComp comps, uint256 listingID) internal view returns (uint32) {
    return IndexItemComponent(getAddrByID(comps, IndexItemCompID)).get(genSellID(listingID));
  }

  //////////////////
  // UTILS

  function genID(uint32 merchantIndex, uint32 itemIndex) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("listing", merchantIndex, itemIndex)));
  }

  function genReqAnchor(uint256 regID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("listing.requirement", regID)));
  }

  function genBuyID(uint256 regID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("listing.buy", regID)));
  }

  function genSellID(uint256 regID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("listing.sell", regID)));
  }
}
