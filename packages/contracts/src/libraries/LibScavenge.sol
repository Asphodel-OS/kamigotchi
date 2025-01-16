// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibData } from "libraries/LibData.sol";
import { LibAllo } from "libraries/LibAllo.sol";

/** @notice
 * Scavenge (scav bar) is a point counter that distributes fungible rewards on a linear curve.
 * ScavPoints are reset upon claiming rewards, and can be claimed anytime.
 * Primary use case: Harvesting nodes, with droptable rewards
 *
 * Shape (registry): hash("registry.scavenge", "field (e.g. node)", index)
 * - IsReg
 * - Value (cost per reward tier)
 * - Rewards (x1 per tier)
 *   - Type (DROPTABLE | any other type)
 *   - Index + Value (flat reward)
 *   - Droptable (droptable reward - only one per scav bar for now)
 *
 * Shape (individual): hash("scavenge.instance", holderID, "field (e.g. node)", index)
 * - Value (current points)
 */
library LibScavenge {
  //////////////
  // SHAPES

  /// @notice creates a registry entry
  function create(
    IUintComp components,
    string memory field,
    uint32 index,
    uint256 tierCost
  ) internal returns (uint256 id) {
    id = genRegID(field, index);
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).set(id);
    IndexComponent(getAddrByID(components, IndexCompID)).set(id, index);
    ValueComponent(getAddrByID(components, ValueCompID)).set(id, tierCost);
    TypeComponent(getAddrByID(components, TypeCompID)).set(id, field);
  }

  function remove(IUintComp components, uint256 id) internal {
    IndexComponent(getAddrByID(components, IndexCompID)).remove(id);
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).remove(id);
    ValueComponent(getAddrByID(components, ValueCompID)).remove(id);
    TypeComponent(getAddrByID(components, TypeCompID)).remove(id);

    uint256[] memory rewards = getRewards(components, id);
    LibAllo.remove(components, rewards);
  }

  /////////////////
  // INTERACTIONS

  /// @notice increases scav bar points for holder
  function incFor(
    IUintComp components,
    string memory field,
    uint32 index,
    uint256 amt,
    uint256 holderID
  ) internal {
    uint256 id = genInstanceID(field, index, holderID);
    ValueComponent(getAddrByID(components, ValueCompID)).inc(id, amt);
  }

  /// @notice reduces max number of claimable scavbar tiers, returns tiers removed
  function extractNumTiers(
    IUintComp components,
    uint256 regID,
    string memory field,
    uint32 index,
    uint256 holderID
  ) internal returns (uint256) {
    ValueComponent valComp = ValueComponent(getAddrByID(components, ValueCompID));

    uint256 instanceID = genInstanceID(field, index, holderID);
    uint256 curr = valComp.safeGet(instanceID);
    uint256 tierCost = valComp.get(regID);

    uint256 numTiers = curr / tierCost;
    valComp.set(instanceID, curr % tierCost);
    return numTiers;
  }

  function distributeRewards(
    IWorld world,
    IUintComp components,
    uint256 regID,
    uint256 count,
    uint256 holderID
  ) internal {
    uint256[] memory rwdIDs = getRewards(components, regID);
    LibAllo.distribute(world, components, rwdIDs, count, holderID);
  }

  /////////////////
  // GETTERS

  /// @notice gets fe
  function getMetadata(
    IUintComp components,
    uint256 id
  ) internal view returns (string memory, uint32 index) {
    return (
      TypeComponent(getAddrByID(components, TypeCompID)).get(id),
      IndexComponent(getAddrByID(components, IndexCompID)).get(id)
    );
  }

  function getRegistryID(
    IUintComp components,
    string memory field,
    uint32 index
  ) internal view returns (uint256) {
    uint256 id = genRegID(field, index);
    return IsRegistryComponent(getAddrByID(components, IsRegCompID)).has(id) ? id : 0;
  }

  function getRewards(
    IUintComp components,
    uint256 regID
  ) internal view returns (uint256[] memory) {
    return LibAllo.queryFor(components, genAlloAnchor(regID));
  }

  /////////////////
  // LOGGING

  function logClaim(
    IUintComp components,
    string memory field,
    uint32 index,
    uint256 amt,
    uint256 accID
  ) public {
    LibData.inc(
      components,
      accID,
      index,
      LibString.concat("SCAV_CLAIM_", LibString.upper(field)),
      amt
    );
  }

  /////////////////
  // UTILS

  function genRegID(string memory field, uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("registry.scavenge", field, index)));
  }

  function genAlloAnchor(uint256 regID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("scavenge.reward", regID)));
  }

  function genInstanceID(
    string memory field,
    uint32 index,
    uint256 holderID
  ) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("scavenge.instance", field, index, holderID)));
  }
}
