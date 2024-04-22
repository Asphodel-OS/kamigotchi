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

  //////////////////
  // INTERACTIONS

  function getMultiplier(
    Multipliers memory mult,
    Effectiveness eff
  ) internal pure returns (uint256) {
    if (eff == Effectiveness.Strong) return mult.up;
    else if (eff == Effectiveness.Weak) return mult.down;
    else return mult.base;
  }

  /// @notice gets the final multiplier
  /// @dev wrapper function for easier multipliers handling
  function getMultiplier(
    uint32[8] memory baseVals, // [base, up, down]
    int256 bonusBase,
    int256 bonusUp,
    int256 bonusDown,
    Effectiveness eff
  ) internal pure returns (uint256) {
    Multipliers memory mult = calcMultipliers(baseVals, bonusBase, bonusUp, bonusDown);
    return getMultiplier(mult, eff);
  }

  /// @notice gets the final multiplier
  /// @dev wrapper function for easy bonus/config handling
  function getMultiplier(
    IUintComp components,
    string memory config, // assumes format [base, up, down]
    uint256 holderID,
    string memory bonusBase,
    string memory bonusUp,
    string memory bonusDown,
    Effectiveness eff
  ) internal view returns (uint256) {
    Multipliers memory mult = calcMultipliers(
      components,
      config,
      holderID,
      bonusBase,
      bonusUp,
      bonusDown
    );
    return getMultiplier(mult, eff);
  }

  // return the multiplier between a single source affinity and single target affinity.
  // NOTE: values returned are denominated in percent (1e2 precision).
  function getAttackStrength(
    IUintComp components,
    string memory sourceAff,
    string memory targetAff
  ) public view returns (Effectiveness) {
    if (LibString.eq(sourceAff, "EERIE")) {
      if (LibString.eq(targetAff, "SCRAP")) return Effectiveness.Strong;
      if (LibString.eq(targetAff, "INSECT")) return Effectiveness.Weak;
    } else if (LibString.eq(sourceAff, "SCRAP")) {
      if (LibString.eq(targetAff, "INSECT")) return Effectiveness.Strong;
      if (LibString.eq(targetAff, "EERIE")) return Effectiveness.Weak;
    } else if (LibString.eq(sourceAff, "INSECT")) {
      if (LibString.eq(targetAff, "EERIE")) return Effectiveness.Strong;
      if (LibString.eq(targetAff, "SCRAP")) return Effectiveness.Weak;
    } else return Effectiveness.Netural; // Normal or no Affinity means 1x multiplier
  }

  // return the multiplier between a single source affinity and single node affinity.
  // NOTE: values returned are denominated in percent (1e2 precision).
  function getHarvestStrength(
    IUintComp components,
    string memory sourceAff,
    string memory targetAff
  ) public view returns (Effectiveness) {
    // default case is misalignment
    if (LibString.eq(sourceAff, "NORMAL")) return Effectiveness.Netural;
    else if (LibString.eq(targetAff, "NORMAL")) return Effectiveness.Netural;
    else if (LibString.eq(targetAff, "")) return Effectiveness.Netural;
    else if (LibString.eq(sourceAff, targetAff)) return Effectiveness.Strong;
    else return Effectiveness.Weak;
  }

  /////////////////////
  // CALCS

  /// @notice calculates a Multiplier struct from a given base, up, and down bonuses
  function calcMultipliers(
    uint32[8] memory baseVals, // [base, up, down]
    int256 bonusBase,
    int256 bonusUp,
    int256 bonusDown
  ) internal pure returns (Multipliers memory) {
    Multipliers memory mult = Multipliers({
      base: uint256(baseVals[0]),
      up: uint256(baseVals[1]),
      down: uint256(baseVals[2])
    });

    mult.base = LibBonus.calcSigned(mult.base, bonusBase);
    mult.up = LibBonus.calcSigned(mult.up, bonusUp);
    mult.down = LibBonus.calcSigned(mult.down, bonusDown);
    return mult;
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
