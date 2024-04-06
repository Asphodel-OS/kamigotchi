// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
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
    IUintComp components,
    string memory sourceAff,
    string memory targetAff
  ) public view returns (uint256) {
    uint32[8] memory configVals = LibConfig.getArray(components, "LIQ_THRESH_MULT_AFF");
    uint256 multBase = uint256(configVals[0]);
    uint256 multUp = uint256(configVals[1]);
    uint256 multDown = uint256(configVals[2]);

    uint256 multiplier = multBase;
    if (LibString.eq(sourceAff, "EERIE")) {
      if (LibString.eq(targetAff, "SCRAP")) multiplier = multUp;
      if (LibString.eq(targetAff, "INSECT")) multiplier = multDown;
    } else if (LibString.eq(sourceAff, "SCRAP")) {
      if (LibString.eq(targetAff, "INSECT")) multiplier = multUp;
      if (LibString.eq(targetAff, "EERIE")) multiplier = multDown;
    } else if (LibString.eq(sourceAff, "INSECT")) {
      if (LibString.eq(targetAff, "EERIE")) multiplier = multUp;
      if (LibString.eq(targetAff, "SCRAP")) multiplier = multDown;
    }
    return multiplier; // Normal or no Affinity means 1x multiplier
  }

  // return the multiplier between a single source affinity and single node affinity.
  // NOTE: values returned are denominated in percent (1e2 precision).
  function getHarvestMultiplier(
    IUintComp components,
    string memory sourceAff,
    string memory targetAff
  ) public view returns (uint256) {
    uint32[8] memory values = LibConfig.getArray(components, "HARVEST_RATE_MULT_AFF");

    uint256 multBase = uint256(values[0]);
    uint256 multUp = uint256(values[1]);
    uint256 multDown = uint256(values[2]);

    // default case is misalignment
    uint256 multiplier = multDown;
    if (LibString.eq(sourceAff, "NORMAL")) multiplier = multBase;
    else if (LibString.eq(targetAff, "NORMAL")) multiplier = multBase;
    else if (LibString.eq(targetAff, "")) multiplier = multBase;
    else if (LibString.eq(sourceAff, targetAff)) multiplier = multUp;
    return multiplier;
  }
}
