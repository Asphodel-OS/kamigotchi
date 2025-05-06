// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";

import { IDOwnsTaxComponent, ID as IDOwnsTaxCompID } from "components/IDOwnsTaxComponent.sol";
import { IdTargetComponent, ID as IdTargetCompID } from "components/IdTargetComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

uint256 constant PRECISION = 1e4;

/** @notice
 * Tax entities. Primarily intended to be used for Harvests
 *
 * Shape:
 *   - EntityType: TAX
 *   - IDOwnsTax: Owner (Harvest: harvestID)
 *   - IdTarget: Recipient
 *   - Value: tax percentage in basis points
 *
 * More complex tax shapes (e.g. attaching tax entities on Accounts for goals/factions)
 * can be included by using an anchor for IDOwnsTax
 * Could include type/index for different tax calcs (e.g. flat musu cost upon feed)
 */
library LibTax {
  function create(
    IUintComp comps,
    uint256 payerID, // or anchor
    uint256 recipientID,
    uint256 value
  ) internal returns (uint256 id) {
    if (value > 2000) revert("LibTax: cannot be more than 100%");
    id = genID(payerID, recipientID);

    LibEntityType.set(comps, id, "TAX");
    IDOwnsTaxComponent(getAddrByID(comps, IDOwnsTaxCompID)).set(id, payerID);
    IdTargetComponent(getAddrByID(comps, IdTargetCompID)).set(id, recipientID);
    ValueComponent(getAddrByID(comps, ValueCompID)).set(id, value);
  }

  function remove(IUintComp comps, uint256 id) internal {
    LibEntityType.remove(comps, id);
    IDOwnsTaxComponent(getAddrByID(comps, IDOwnsTaxCompID)).remove(id);
    IdTargetComponent(getAddrByID(comps, IdTargetCompID)).remove(id);
    ValueComponent(getAddrByID(comps, ValueCompID)).remove(id);
  }

  function remove(IUintComp comps, uint256[] memory ids) internal {
    LibEntityType.remove(comps, ids);
    IDOwnsTaxComponent(getAddrByID(comps, IDOwnsTaxCompID)).remove(ids);
    IdTargetComponent(getAddrByID(comps, IdTargetCompID)).remove(ids);
    ValueComponent(getAddrByID(comps, ValueCompID)).remove(ids);
  }

  function removeFor(IUintComp comps, uint256 payerID) internal {
    uint256[] memory ids = getFor(comps, payerID);
    if (ids.length > 0) remove(comps, ids);
  }

  /////////////////
  // GETTERS

  function getFor(IUintComp comps, uint256 payerID) internal view returns (uint256[] memory) {
    return IDOwnsTaxComponent(getAddrByID(comps, IDOwnsTaxCompID)).getEntitiesWithValue(payerID);
  }

  function getBillFor(
    IUintComp comps,
    uint256 originalAmt,
    uint256 payerID
  ) internal view returns (uint256[] memory recipientIDs, uint256[] memory amts, uint256 amtLeft) {
    uint256[] memory ids = getFor(comps, payerID);
    recipientIDs = IdTargetComponent(getAddrByID(comps, IdTargetCompID)).get(ids);
    uint256[] memory rates = ValueComponent(getAddrByID(comps, ValueCompID)).get(ids);
    (amts, amtLeft) = calcBill(originalAmt, rates);
  }

  /////////////////
  // CALCS

  function calcBill(
    uint256 original,
    uint256[] memory rates
  ) internal pure returns (uint256[] memory amts, uint256 amtLeft) {
    amts = new uint256[](rates.length);
    amtLeft = original;
    for (uint256 i; i < rates.length; i++) {
      amts[i] = (original * rates[i]) / PRECISION;
      amtLeft -= amts[i];
    }
  }

  /////////////////
  // IDs

  function genID(uint256 anchorID, uint256 taxerID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("tax.instance", anchorID, taxerID)));
  }
}
