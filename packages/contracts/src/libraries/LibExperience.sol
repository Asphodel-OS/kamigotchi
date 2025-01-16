// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { FixedPointMathLib as LibFPMath } from "solady/utils/FixedPointMathLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddrByID, getCompByID, addressToEntity } from "solecs/utils.sol";

import { ExperienceComponent, ID as ExpCompID } from "components/ExperienceComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibData } from "libraries/LibData.sol";

// This library is a wrapper that provides useful functions around the experience and level
// components. The progression calculation is bsed on
//
library LibExperience {
  using LibFPMath for int256;
  using LibComp for IUintComp;

  /////////////////
  // INTERACTIONS

  // increase experience by a specified value
  function inc(IUintComp components, uint256 id, uint256 value) internal {
    ExperienceComponent(getAddrByID(components, ExpCompID)).inc(id, value);
  }

  // decrease experience by a specified value
  function dec(IUintComp components, uint256 id, uint256 value) internal {
    ExperienceComponent(getAddrByID(components, ExpCompID)).dec(id, value);
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
    uint256 base = LibConfig.get(components, "KAMI_LVL_REQ_BASE");
    uint256 multiplier = 1e18;

    if (level > 1) {
      uint32[8] memory configVals = LibConfig.getArray(components, "KAMI_LVL_REQ_MULT_BASE");
      uint multiplierBase = uint256(configVals[0]);
      uint256 multiplierBasePrec = 10 ** uint256(configVals[1]);
      int256 multiplierBaseFormatted = int256((1e18 * multiplierBase) / multiplierBasePrec);
      multiplier = uint256(LibFPMath.powWad(multiplierBaseFormatted, int256(level - 1) * 1e18));
    }
    return (base * multiplier) / 1e18;
  }

  /////////////////
  // CHECKERS

  // check whether an entity has an Experience Component entry
  function has(IUintComp components, uint256 id) internal view returns (bool) {
    return ExperienceComponent(getAddrByID(components, ExpCompID)).has(id);
  }

  // check whether an entity has a Level Component entry
  function hasLevel(IUintComp components, uint256 id) internal view returns (bool) {
    return LevelComponent(getAddrByID(components, LevelCompID)).has(id);
  }

  /////////////////
  // SETTERS

  // set the Experience of an entity to the specified value
  function set(IUintComp components, uint256 id, uint256 value) internal {
    ExperienceComponent(getAddrByID(components, ExpCompID)).set(id, value);
  }

  // set the Level of an entity to the specified value
  function setLevel(IUintComp components, uint256 id, uint256 value) internal {
    LevelComponent(getAddrByID(components, LevelCompID)).set(id, value);
  }

  /////////////////
  // GETTERS

  // get the Experience of an entity, defaults to 0 if not found
  function get(IUintComp components, uint256 id) internal view returns (uint256) {
    return ExperienceComponent(getAddrByID(components, ExpCompID)).safeGet(id);
  }

  // get the Level of an entity, defaults to 1 if not found
  function getLevel(IUintComp components, uint256 id) internal view returns (uint256) {
    LevelComponent comp = LevelComponent(getAddrByID(components, LevelCompID));
    if (!comp.has(id)) return 1;
    return comp.get(id);
  }

  /////////////////
  // LOGGING

  function logPetLevelInc(IUintComp components, uint256 holderID) public {
    LibData.inc(components, holderID, 0, "KAMI_LEVELS_TOTAL", 1);
  }
}
