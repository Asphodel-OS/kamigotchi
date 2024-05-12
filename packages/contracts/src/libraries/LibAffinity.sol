// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { LibBonus } from "libraries/LibBonus.sol";
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

  struct Multipliers {
    uint256 base;
    uint256 up;
    uint256 down;
  }

  struct Shifts {
    int256 base;
    int256 up;
    int256 down;
  }

  //////////////////
  // INTERACTIONS

  function getMultiplier(
    Multipliers memory mults,
    Effectiveness eff
  ) internal pure returns (uint256) {
    if (eff == Effectiveness.Strong) return mults.up;
    else if (eff == Effectiveness.Weak) return mults.down;
    else return mults.base;
  }

  function getMultiplier(
    uint32[8] memory baseVals, // [base, up, down]
    int256 bonus, // bonus applies to all values here
    Effectiveness eff
  ) internal pure returns (uint256) {
    Multipliers memory mults = calcMultipliers(baseVals, bonus);
    return getMultiplier(mults, eff);
  }

  /// @notice gets the final multiplier
  /// @dev wrapper function for easier multipliers handling. individual bonus
  function getMultiplier(
    uint32[8] memory baseVals, // [base, up, down]
    int256 bonusBase,
    int256 bonusUp,
    int256 bonusDown,
    Effectiveness eff
  ) internal pure returns (uint256) {
    Multipliers memory mults = calcMultipliers(baseVals, bonusBase, bonusUp, bonusDown);
    return getMultiplier(mults, eff);
  }

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

  /////////////////////
  // CALCS

  /// @notice calculates a Multiplier struct from a given base, up, and down bonuses
  /// @dev for a universal bonus
  function calcMultipliers(
    uint32[8] memory baseVals, // [base, up, down]
    int256 bonus
  ) internal pure returns (Multipliers memory) {
    Multipliers memory mults = Multipliers({
      base: uint256(baseVals[0]),
      up: uint256(baseVals[1]),
      down: uint256(baseVals[2])
    });

    mults.base = LibBonus.calcSigned(mults.base, bonus);
    mults.up = LibBonus.calcSigned(mults.up, bonus);
    mults.down = LibBonus.calcSigned(mults.down, bonus);
    return mults;
  }

  /// @notice calculates a Multiplier struct from a given base, up, and down bonuses
  /// @dev for a universal bonus, wrapper function for easier config and bonus handling
  function calcMultipliers(
    IUintComp components,
    string memory config, // assumes format [base, up, down]
    uint256 holderID,
    string memory bonus
  ) internal view returns (Multipliers memory) {
    return
      calcMultipliers(
        LibConfig.getArray(components, config),
        bonus.eq("") ? int(0) : LibBonus.getRaw(components, holderID, bonus)
      );
  }

  /// @notice calculates a Multiplier struct from a given base, up, and down bonuses
  function calcMultipliers(
    uint32[8] memory baseVals, // [base, up, down]
    int256 bonusBase,
    int256 bonusUp,
    int256 bonusDown
  ) internal pure returns (Multipliers memory) {
    Multipliers memory mults = Multipliers({
      base: uint256(baseVals[0]),
      up: uint256(baseVals[1]),
      down: uint256(baseVals[2])
    });

    mults.base = LibBonus.calcSigned(mults.base, bonusBase);
    mults.up = LibBonus.calcSigned(mults.up, bonusUp);
    mults.down = LibBonus.calcSigned(mults.down, bonusDown);
    return mults;
  }

  /// @notice calculates a Multiplier struct from a given base, up, and down bonuses
  /// @dev wrapper function for easy bonus and config handling
  function calcMultipliers(
    IUintComp components,
    string memory config, // assumes format [base, up, down]
    uint256 holderID,
    string memory bonusBase,
    string memory bonusUp,
    string memory bonusDown
  ) internal view returns (Multipliers memory) {
    return
      calcMultipliers(
        LibConfig.getArray(components, config),
        bonusBase.eq("") ? int(0) : LibBonus.getRaw(components, holderID, bonusBase),
        bonusUp.eq("") ? int(0) : LibBonus.getRaw(components, holderID, bonusUp),
        bonusDown.eq("") ? int(0) : LibBonus.getRaw(components, holderID, bonusDown)
      );
  }
}
