// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IndexNPCComponent, ID as IndexNPCComponentID } from "components/IndexNPCComponent.sol";
import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { DecayComponent, ID as DecayCompID } from "components/DecayComponent.sol";
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
 *  - Value: the target price of the listing (not necessarily the actual price)
 *  - Balance: the number of units bought or sold
 *  - TimeStart: the time the item was created
 *
 * Pricing entities are shaped depending on their type of pricing.
 * The Buy Side and Sell Side pricing can be defined in a handful of ways:
 *  - FIXED: direct read of ValueComp on the actual Listing entity
 *  - GDA: dynamic price calc based the Balance, TimeStart and Value target of the Listing
 *  - SCALED: scaled version of the Buy Side price calc (sell only)
 */
library LibListingRegistry {
  using LibComp for IUintComp;

  /// @notice create a merchant listing with the specified parameters
  function create(
    IUintComp comps,
    uint32 npcIndex,
    uint32 itemIndex,
    uint256 value // target base price
  ) internal returns (uint256 id) {
    id = genID(npcIndex, itemIndex);
    LibEntityType.set(comps, id, "LISTING");
    IndexNPCComponent(getAddrByID(comps, IndexNPCComponentID)).set(id, npcIndex);
    IndexItemComponent(getAddrByID(comps, IndexItemCompID)).set(id, itemIndex);
    BalanceComponent(getAddrByID(comps, BalanceCompID)).set(id, 0);
    TimeStartComponent(getAddrByID(comps, TimeStartCompID)).set(id, block.timestamp);
    ValueComponent(getAddrByID(comps, ValueCompID)).set(id, value);
  }

  /// @notice refresh a listing's tracking data (balance, start time, value)
  /// @dev target value is only updated if value != 0
  function refresh(IUintComp comps, uint256 id, uint256 value) internal {
    TimeStartComponent(getAddrByID(comps, TimeStartCompID)).set(id, block.timestamp);
    BalanceComponent(getAddrByID(comps, BalanceCompID)).set(id, 0);
    if (value != 0) ValueComponent(getAddrByID(comps, ValueCompID)).set(id, value);
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

  //////////////////
  // SETTERS

  function setType(IUintComp comps, uint256 id, string memory type_) internal {
    TypeComponent(getAddrByID(comps, TypeCompID)).set(id, type_);
  }

  // set the buy price of a listing as the Value of the Listing Entity
  function setBuyFixed(IUintComp comps, uint256 id) internal {
    uint256 ptr = genBuyID(id);
    setType(comps, ptr, "FIXED");
  }

  // set the requisite pricing variables for GDA price
  // scale: 1e6 precision -- decay: 1e9 precision
  function setBuyGDA(IUintComp comps, uint256 id, int32 scale, int32 decay) internal {
    uint256 ptr = genBuyID(id);
    setType(comps, ptr, "GDA");
    require(scale >= 1e6, "LibListingRegistry: compound > 1 required");
    require(decay >= 0, "LibListingRegistry: decay must be positive");
    ScaleComponent(getAddrByID(comps, ScaleCompID)).set(ptr, scale);
    DecayComponent(getAddrByID(comps, DecayCompID)).set(ptr, decay);
  }

  // set the sell price of a listing as the Value of the Listing Entity
  function setSellFixed(IUintComp comps, uint256 id) internal {
    uint256 ptr = genSellID(id);
    setType(comps, ptr, "FIXED");
  }

  // set the sell price of a listing as a scaled value of the buy price
  // NOTE: scaled pricing is defined with 3 degrees of precision
  // NOTE: we ensure interpreted scale within bounds to avoid economic vulns
  function setSellScaled(IUintComp comps, uint256 id, int32 scale) internal {
    uint256 ptr = genSellID(id);
    setType(comps, ptr, "SCALED");
    require(scale <= 1e6, "LibListingRegistry: invalid sell scale > 1");
    require(scale >= 0, "LibListingRegistry: invalid sell scale < 0");
    ScaleComponent(getAddrByID(comps, ScaleCompID)).set(ptr, scale);
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
