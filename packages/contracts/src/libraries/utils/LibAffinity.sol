// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";

import { LibConfig } from "libraries/LibConfig.sol";

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

/*
 * LibAffinity handles the storage and manipulation of affinity multipliers
 * accross all contexts. This is a fake registry. We're hardcoding and booting the
 * work until it's worth doing.
 */
library LibAffinity {
  using LibString for string;
  using SafeCastLib for uint32;

  // derives the shifts from a shift config
  function getShifts(
    IUintComp components,
    string memory key
  ) internal view returns (Shifts memory) {
    uint32[8] memory config = LibConfig.getArray(components, key);
    return
      Shifts({
        base: config[1].toInt256(),
        up: config[2].toInt256(),
        down: -1 * config[3].toInt256()
      });
  }

  // gets the shift to efficacy from effectiveness using base config and bonus
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
