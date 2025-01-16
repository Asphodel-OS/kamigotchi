// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { LibConfig } from "libraries/LibConfig.sol";

/*
 * LibAffinity handles the storage and manipulation of affinity multipliers
 * accross all contexts. This is a fake registry. We're hardcoding and booting the
 * work until it's worth doing.
 */
library LibAffinity {
  using LibString for string;

  enum Effectiveness {
    Strong,
    Netural,
    Weak
  }

  struct Shifts {
    int256 base;
    int256 up;
    int256 down;
  }

  //////////////////
  // INTERACTIONS

  // gets the shift to efficacy from effectiveness using basse config and bonus
  function calcEfficacyShift(
    Effectiveness effectiveness,
    Shifts memory configs,
    Shifts memory bonuses
  ) internal pure returns (int256) {
    if (effectiveness == Effectiveness.Strong) return configs.up + bonuses.up;
    if (effectiveness == Effectiveness.Weak) return configs.down + bonuses.down;
    return configs.base + bonuses.base;
  }

  /// @notice return the multiplier between a single source affinity and single target affinity.
  function getAttackEffectiveness(
    string memory sourceAff,
    string memory targetAff
  ) public pure returns (Effectiveness) {
    if (LibString.eq(sourceAff, "EERIE")) {
      if (LibString.eq(targetAff, "SCRAP")) return Effectiveness.Strong;
      if (LibString.eq(targetAff, "INSECT")) return Effectiveness.Weak;
    } else if (LibString.eq(sourceAff, "SCRAP")) {
      if (LibString.eq(targetAff, "INSECT")) return Effectiveness.Strong;
      if (LibString.eq(targetAff, "EERIE")) return Effectiveness.Weak;
    } else if (LibString.eq(sourceAff, "INSECT")) {
      if (LibString.eq(targetAff, "EERIE")) return Effectiveness.Strong;
      if (LibString.eq(targetAff, "SCRAP")) return Effectiveness.Weak;
    }
    return Effectiveness.Netural; // Normal or no Affinity means 1x multiplier
  }

  /// @notice return the multiplier between a single source affinity and single node affinity.
  function getHarvestEffectiveness(
    string memory sourceAff,
    string memory targetAff
  ) public pure returns (Effectiveness) {
    if (LibString.eq(sourceAff, "NORMAL")) return Effectiveness.Netural;
    if (LibString.eq(targetAff, "NORMAL")) return Effectiveness.Netural;
    if (LibString.eq(targetAff, "")) return Effectiveness.Netural;
    if (LibString.eq(sourceAff, targetAff)) return Effectiveness.Strong;
    return Effectiveness.Weak;
  }
}
