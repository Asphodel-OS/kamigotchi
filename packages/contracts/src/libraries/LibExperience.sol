// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { FixedPointMathLib as LibFPMath } from "solady/utils/FixedPointMathLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById, getComponentById, addressToEntity } from "solecs/utils.sol";

import { ExperienceComponent, ID as ExpCompID } from "components/ExperienceComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";
import { LibConfig } from "libraries/LibConfig.sol";

// This library is a wrapper that provides useful functions around the experience and level
// components. The progression calculation is bsed on
//
library LibExperience {
  using LibFPMath for int256;

  /////////////////
  // INTERACTIONS

  // increase experience by a specified value
  function inc(IUintComp components, uint256 id, uint256 value) internal {
    uint256 experience = get(components, id);
    set(components, id, experience + value);
  }

  // decrease experience by a specified value
  function dec(IUintComp components, uint256 id, uint256 value) internal {
    uint256 currExp = get(components, id);
    uint256 diff = (currExp > value) ? currExp - value : 0;
    set(components, id, diff);
  }

  // increase level by a specified value
  function incLevel(IUintComp components, uint256 id, uint256 value) internal {
    uint256 level = getLevel(components, id);
    setLevel(components, id, level + value);
  }

  /////////////////
  // CALCULATIONS

  // calculate the experience cost to level up for a given entity, rounded down
  // atm assumes the entity passed in is a kami
  // cost = k * a^(x-1); k := base, a := multiplierBase, x := level, a^(x-1) := multiplier
  function calcLevelCost(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 level = getLevel(components, id);
    uint256 base = LibConfig.getValueOf(components, "KAMI_LVL_REQ_BASE");
    uint256 multiplier = 1e18;

    if (level > 1) {
      uint multiplierBase = LibConfig.getValueOf(components, "KAMI_LVL_REQ_MULT_BASE");
      uint256 multiplierBasePrec = 10 **
        LibConfig.getValueOf(components, "KAMI_LVL_REQ_MULT_BASE_PREC");
      int256 multiplierBaseFormatted = int256((1e18 * multiplierBase) / multiplierBasePrec);
      multiplier = uint256(LibFPMath.powWad(multiplierBaseFormatted, int256(level - 1) * 1e18));
    }
    return (base * multiplier) / 1e18;
  }

  /////////////////
  // CHECKERS

  // check whether an entity has an Experience Component entry
  function has(IUintComp components, uint256 id) internal view returns (bool) {
    return ExperienceComponent(getAddressById(components, ExpCompID)).has(id);
  }

  // check whether an entity has a Level Component entry
  function hasLevel(IUintComp components, uint256 id) internal view returns (bool) {
    return LevelComponent(getAddressById(components, LevelCompID)).has(id);
  }

  /////////////////
  // SETTERS

  // set the Experience of an entity to the specified value
  function set(IUintComp components, uint256 id, uint256 value) internal {
    ExperienceComponent(getAddressById(components, ExpCompID)).set(id, value);
  }

  // set the Level of an entity to the specified value
  function setLevel(IUintComp components, uint256 id, uint256 value) internal {
    LevelComponent(getAddressById(components, LevelCompID)).set(id, value);
  }

  /////////////////
  // GETTERS

  // get the Experience of an entity, defaults to 0 if not found
  function get(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!has(components, id)) return 0;
    return ExperienceComponent(getAddressById(components, ExpCompID)).getValue(id);
  }

  // get the Level of an entity, defaults to 1 if not found
  function getLevel(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!hasLevel(components, id)) return 1;
    return LevelComponent(getAddressById(components, LevelCompID)).getValue(id);
  }
}
