// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IndexNPCComponent, ID as IndexNPCComponentID } from "components/IndexNPCComponent.sol";
import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
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
    IUintComp components,
    uint32 npcIndex,
    uint32 itemIndex,
    uint256 value // target base price
  ) internal returns (uint256 id) {
    id = genID(npcIndex, itemIndex);
    LibEntityType.set(components, id, "LISTING");
    IndexNPCComponent(getAddrByID(components, IndexNPCComponentID)).set(id, npcIndex);
    IndexItemComponent(getAddrByID(components, IndexItemCompID)).set(id, itemIndex);
    BalanceComponent(getAddrByID(components, BalanceCompID)).set(id, 0);
    TimeStartComponent(getAddrByID(components, TimeStartCompID)).set(id, block.timestamp);
    ValueComponent(getAddrByID(components, ValueCompID)).set(id, value);
  }

  /// @notice create a requirement for a listing
  /// @dev requirements apply equally to buy and sell
  function createRequirement(
    IWorld world,
    IUintComp components,
    uint256 regID,
    Condition memory data
  ) internal returns (uint256) {
    return LibConditional.createFor(world, components, data, genReqAnchor(regID));
  }

  /// @notice remove all data associated with a listing
  function remove(IUintComp components, uint256 id) internal {
    LibEntityType.remove(components, id);
    IndexNPCComponent(getAddrByID(components, IndexNPCComponentID)).remove(id);
    IndexItemComponent(getAddrByID(components, IndexItemCompID)).remove(id);
    BalanceComponent(getAddrByID(components, BalanceCompID)).remove(id);
    TimeStartComponent(getAddrByID(components, TimeStartCompID)).remove(id);
    ValueComponent(getAddrByID(components, ValueCompID)).remove(id);

    removeBuy(components, id);
    removeSell(components, id);

    uint256[] memory requirements = LibConditional.queryFor(components, genReqAnchor(id));
    for (uint256 i; i < requirements.length; i++) {
      LibConditional.remove(components, requirements[i]);
    }
  }

  /// @notice remove the buy pricing
  function removeBuy(IUintComp components, uint256 id) internal {
    uint256 ptr = genBuyID(id);
    TypeComponent(getAddrByID(components, TypeCompID)).remove(ptr);
    ValueComponent(getAddrByID(components, ValueCompID)).remove(ptr);
  }

  /// @notice remove the sell pricing
  function removeSell(IUintComp components, uint256 id) internal {
    uint256 ptr = genSellID(id);
    TypeComponent(getAddrByID(components, TypeCompID)).remove(ptr);
    ValueComponent(getAddrByID(components, ValueCompID)).remove(ptr);
    ScaleComponent(getAddrByID(components, ScaleCompID)).remove(ptr);
  }

  /////////////////
  // GETTERS

  // gets an item listing from a merchant by its indices
  function get(
    IUintComp components,
    uint32 merchantIndex,
    uint32 itemIndex
  ) internal view returns (uint256 result) {
    uint256 id = genID(merchantIndex, itemIndex);
    return LibEntityType.isShape(components, id, "LISTING") ? id : 0;
  }

  //////////////////
  // SETTERS

  function setType(IUintComp components, uint256 id, string memory type_) internal {
    TypeComponent(getAddrByID(components, TypeCompID)).set(id, type_);
  }

  // set the buy price of a listing as the Value of the Listing Entity
  function setBuyFixed(IUintComp components, uint256 id) internal {
    uint256 ptr = genBuyID(id);
    setType(components, ptr, "FIXED");
  }

  // set the sell price of a listing as the Value of the Listing Entity
  function setSellFixed(IUintComp components, uint256 id) internal {
    uint256 ptr = genSellID(id);
    setType(components, ptr, "FIXED");
  }

  // set the sell price of a listing as a scaled value of the buy price
  // NOTE: scaled pricing is defined with 3 degrees of precision
  // NOTE: we ensure interpreted scale within bounds to avoid economic vulns
  function setSellScaled(IUintComp components, uint256 id, int32 scale) internal {
    uint256 ptr = genSellID(id);
    setType(components, ptr, "SCALED");
    require(scale > 1e3, "LibListingRegistry: invalid sell scale > 1");
    require(scale < 0, "LibListingRegistry: invalid sell scale < 0");
    ScaleComponent(getAddrByID(components, ScaleCompID)).set(ptr, scale);
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
