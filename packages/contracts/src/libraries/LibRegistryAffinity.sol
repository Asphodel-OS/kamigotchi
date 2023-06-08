// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { LibConfig } from "libraries/LibConfig.sol";

/*
 * LibRegistryAffinity handles the storage and manipulation of affinity multipliers
 * accross all contexts. This is a fake registry. We're hardcoding and booting the
 * work until it's worth doing.
 */
library LibRegistryAffinity {
  // return the multiplier between a single source affinity and single target affinity.
  // NOTE: values returned are denominated in percent (1e2 precision).
  function getAttackMultiplier(
    string memory sourceAff,
    string memory targetAff
  ) internal pure returns (uint256) {
    uint256 multiplier = 100;

    if (LibString.eq(sourceAff, "EERIE")) {
      if (LibString.eq(targetAff, "SCRAP")) multiplier = 200;
      if (LibString.eq(targetAff, "INSECT")) multiplier = 50;
    } else if (LibString.eq(sourceAff, "SCRAP")) {
      if (LibString.eq(targetAff, "INSECT")) multiplier = 200;
      if (LibString.eq(targetAff, "EERIE")) multiplier = 50;
    } else if (LibString.eq(sourceAff, "INSECT")) {
      if (LibString.eq(targetAff, "EERIE")) multiplier = 200;
      if (LibString.eq(targetAff, "SCRAP")) multiplier = 50;
    }
    return multiplier; // Normal or no Affinity means 1x multiplier
  }

  // return the multiplier between a single source affinity and single node affinity.
  // NOTE: values returned are denominated in percent (1e2 precision).
  function getHarvestMultiplier(
    IUintComp components,
    string memory sourceAff,
    string memory targetAff
  ) internal view returns (uint256) {
    uint256 multBase = LibConfig.getValueOf(components, "HARVEST_RATE_MULT_AFF_BASE");
    uint256 multUp = LibConfig.getValueOf(components, "HARVEST_RATE_MULT_AFF_UP");
    uint256 multDown = LibConfig.getValueOf(components, "HARVEST_RATE_MULT_AFF_DOWN");

    // default case is misalignment
    uint256 multiplier = multDown;
    if (LibString.eq(sourceAff, "NORMAL")) multiplier = multBase;
    else if (LibString.eq(targetAff, "NORMAL")) multiplier = multBase;
    else if (LibString.eq(sourceAff, targetAff)) multiplier = multUp;
    return multiplier;
  }
}
