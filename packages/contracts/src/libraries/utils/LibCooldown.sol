// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { TimeNextComponent, ID as TimeNextCompID } from "components/TimeNextComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";

import { LibBonus } from "libraries/LibBonus.sol";
import { LibConfig } from "libraries/LibConfig.sol";

library LibCooldown {
  using LibComp for IUintComp;
  using SafeCastLib for int256;
  using SafeCastLib for uint256;

  /////////////////
  // INTERACTIONS

  /// @notice set the next time for an entity to be available
  function set(IUintComp components, uint256 id) internal returns (uint256 endTime) {
    // get entity's cooldown (including bonuses)
    uint256 cooldown = getCooldown(components, id).toUint256(); // cooldown is always positive

    endTime = block.timestamp + cooldown;
    IUintComp(getAddrByID(components, TimeNextCompID)).set(id, endTime);
  }

  // if delta positive, increase cooldown. vice versa
  function modify(
    IUintComp components,
    uint256 id,
    int256 delta
  ) internal returns (uint256 newEnd) {
    TimeNextComponent nextComp = TimeNextComponent(getAddrByID(components, TimeNextCompID));
    uint256 prevTime = nextComp.safeGet(id);

    int256 base;
    if (prevTime > block.timestamp) {
      // CD has not ended, modify from end time
      base = prevTime.toInt256();
    } else {
      // CD has ended, modify from current time
      base = block.timestamp.toInt256();
    }

    newEnd = (base + delta).toUint256();
    nextComp.set(id, newEnd);
  }

  /////////////////
  // CHECKERS

  function isActive(IUintComp components, uint256 id) internal view returns (bool) {
    return block.timestamp < IUintComp(getAddrByID(components, TimeNextCompID)).safeGet(id);
  }

  /// @dev returns true if a single entity is active
  function isActive(IUintComp components, uint256[] memory ids) internal view returns (bool) {
    uint256[] memory nextTimes = TimeNextComponent(getAddrByID(components, TimeNextCompID)).safeGet(
      ids
    );
    for (uint256 i; i < ids.length; i++) {
      if (block.timestamp < nextTimes[i]) return true;
    }
    return false;
  }

  /////////////////
  // GETTERS

  /// @notice get cooldown for entity, including bonus
  function getCooldown(IUintComp components, uint256 id) internal view returns (int256) {
    uint256 base = LibConfig.get(components, "KAMI_STANDARD_COOLDOWN");
    return _getCooldown(components, base, id);
  }

  function getCooldown(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (int256[] memory) {
    uint256 base = LibConfig.get(components, "KAMI_STANDARD_COOLDOWN");
    int256[] memory cooldowns = new int256[](ids.length);
    for (uint256 i; i < ids.length; i++) {
      cooldowns[i] = _getCooldown(components, base, ids[i]);
    }
    return cooldowns;
  }

  function _getCooldown(
    IUintComp components,
    uint256 rawBase,
    uint256 id
  ) internal view returns (int256) {
    int256 base = rawBase.toInt256();
    int256 shift = LibBonus.getFor(components, "STND_COOLDOWN_SHIFT", id);
    int256 cooldown = base + shift;
    return cooldown < int256(0) ? int256(0) : cooldown;
  }
}
