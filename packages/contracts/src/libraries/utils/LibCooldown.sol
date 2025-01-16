// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { TimeLastActionComponent, ID as TimeLastActCompID } from "components/TimeLastActionComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";

import { LibBonus } from "libraries/LibBonus.sol";
import { LibConfig } from "libraries/LibConfig.sol";

library LibCooldown {
  using LibComp for IUintComp;
  using SafeCastLib for int256;
  using SafeCastLib for uint256;

  /////////////////
  // INTERACTIONS

  function start(IUintComp components, uint256 id) internal {
    IUintComp(getAddrByID(components, TimeLastActCompID)).set(id, block.timestamp);
  }

  // if delta positive, increase cooldown. vice versa
  function modify(IUintComp components, uint256 id, int256 delta) internal {
    IUintComp lastComp = IUintComp(getAddrByID(components, TimeLastActCompID));
    int256 idleTime = _getIdleTime(lastComp, id);
    int256 cooldown = getCooldown(components, id);

    int256 newStart = delta + block.timestamp.toInt256();
    if (idleTime <= cooldown) newStart -= idleTime;
    else newStart -= cooldown;

    lastComp.set(id, newStart.toUint256());
  }

  /////////////////
  // CHECKERS

  function isActive(IUintComp components, uint256 id) internal view returns (bool) {
    int256 idleTime = getIdleTime(components, id);
    int256 idleRequirement = getCooldown(components, id);
    return idleTime <= idleRequirement;
  }

  /////////////////
  // GETTERS

  /// @notice get cooldown for entity, including bonus
  function getCooldown(IUintComp components, uint256 id) internal view returns (int256) {
    int256 base = LibConfig.get(components, "KAMI_STANDARD_COOLDOWN").toInt256();
    int256 shift = LibBonus.getFor(components, "STND_COOLDOWN_SHIFT", id);
    int256 cooldown = base + shift;
    return cooldown < int256(0) ? int256(0) : cooldown;
  }

  function getIdleTime(IUintComp components, uint256 id) internal view returns (int256) {
    return _getIdleTime(IUintComp(getAddrByID(components, TimeLastActCompID)), id);
  }

  function _getIdleTime(IUintComp tsComp, uint256 id) internal view returns (int256) {
    // time safely remains in int256 bounds
    return block.timestamp.toInt256() - tsComp.safeGet(id).toInt256();
  }
}
