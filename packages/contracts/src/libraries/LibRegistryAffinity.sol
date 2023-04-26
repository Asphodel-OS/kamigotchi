// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

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

    if (LibString.eq(sourceAff, "Eerie")) {
      if (LibString.eq(targetAff, "Scrap")) multiplier = 200;
      if (LibString.eq(targetAff, "Insect")) multiplier = 50;
    } else if (LibString.eq(sourceAff, "Scrap")) {
      if (LibString.eq(targetAff, "Insect")) multiplier = 200;
      if (LibString.eq(targetAff, "Eerie")) multiplier = 50;
    } else if (LibString.eq(sourceAff, "Insect")) {
      if (LibString.eq(targetAff, "Eerie")) multiplier = 200;
      if (LibString.eq(targetAff, "Scrap")) multiplier = 50;
    }
    return multiplier; // Normal or no Affinity means 1x multiplier
  }

  // return the multiplier between a single source affinity and single node affinity.
  // NOTE: values returned are denominated in percent (1e2 precision).
  function getHarvestMultiplier(
    string memory sourceAff,
    string memory targetAff
  ) internal pure returns (uint256) {
    uint256 multiplier = 50; // default case is misalignment
    if (LibString.eq(sourceAff, "NORMAL")) multiplier = 100;
    else if (LibString.eq(targetAff, "NORMAL")) multiplier = 100;
    else if (LibString.eq(sourceAff, targetAff)) multiplier = 150;
    return multiplier;
  }
}
