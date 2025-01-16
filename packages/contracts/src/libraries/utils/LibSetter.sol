// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibCooldown } from "libraries/utils/LibCooldown.sol";
import { LibData } from "libraries/LibData.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibFactions } from "libraries/LibFactions.sol";
import { LibFlag } from "libraries/LibFlag.sol";
import { LibGoals } from "libraries/LibGoals.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibNPC } from "libraries/LibNPC.sol";
import { LibPhase } from "libraries/utils/LibPhase.sol";
import { LibQuests } from "libraries/LibQuests.sol";
import { LibQuestRegistry } from "libraries/LibQuestRegistry.sol";
import { LibRoom } from "libraries/LibRoom.sol";
import { LibSkill } from "libraries/LibSkill.sol";
import { LibSkillRegistry } from "libraries/LibSkillRegistry.sol";

/** @notice
 * Library for Setting.
 */
library LibSetter {
  using LibString for string;

  /// @notice increase a value. for integration, some values that aren't countable are overwritten instead
  function update(
    IWorld world,
    IUintComp components,
    string memory _type,
    uint32 index,
    uint256 amt,
    uint256 targetID
  ) public {
    if (_type.eq("ITEM")) {
      incInv(components, targetID, index, amt);
    } else if (_type.eq("XP")) {
      LibExperience.inc(components, targetID, amt);
    } else if (_type.eq("REPUTATION")) {
      LibFactions.incRep(components, targetID, index, amt);
    } else if (_type.eq("ROOM")) {
      LibRoom.set(components, targetID, index);
    } else if (_type.startsWith("FLAG_")) {
      // setting, not increasing
      setFlag(components, _type, amt, targetID);
    } else if (_type.eq("STATE")) {
      // setting, not increasing
      setState(components, index, targetID);
    } else {
      LibData.inc(components, targetID, index, _type, amt);
    }
  }

  function dec(
    IUintComp components,
    string memory _type,
    uint32 index,
    uint256 amt,
    uint256 targetID
  ) public {
    if (_type.eq("ITEM")) {
      LibInventory.decFor(components, targetID, index, amt);
    } else {
      revert("LibSetter: unknown type");
    }
  }

  ///////////////
  // INTERNAL

  /// @notice increases inventory balance. if target is a kami, update it's owners balance
  function incInv(IUintComp components, uint256 targetID, uint32 index, uint256 amt) internal {
    if (LibEntityType.isShape(components, targetID, "KAMI")) {
      targetID = LibKami.getAccount(components, targetID);
    }
    LibInventory.incFor(components, targetID, index, amt);
  }

  /// @notice sets flag as true if value > 0, false if value == 0
  function setFlag(
    IUintComp components,
    string memory _type,
    uint256 value,
    uint256 targetID
  ) internal {
    _type = _type.slice(5); // remove "FLAG_"
    LibFlag.set(components, targetID, _type, value > 0);
  }

  function setState(IUintComp components, uint32 index, uint256 targetID) internal {
    string memory entityType = LibEntityType.get(components, targetID);

    if (entityType.eq("KAMI")) LibKami.setStateFromIndex(components, index, targetID);
    else revert("LibSetter: invalid entity state type");
  }
}
