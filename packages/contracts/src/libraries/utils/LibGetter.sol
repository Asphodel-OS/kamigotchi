// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";

import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IsCompleteComponent, ID as IsCompleteCompID } from "components/IsCompleteComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibPhase } from "libraries/utils/LibPhase.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibCooldown } from "libraries/utils/LibCooldown.sol";
import { LibData } from "libraries/LibData.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibFaction } from "libraries/LibFaction.sol";
import { LibFlag } from "libraries/LibFlag.sol";
import { LibGoal } from "libraries/LibGoal.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibNPC } from "libraries/LibNPC.sol";
import { LibQuest } from "libraries/LibQuest.sol";
import { LibQuestRegistry } from "libraries/LibQuestRegistry.sol";
import { LibRoom } from "libraries/LibRoom.sol";
import { LibSkill } from "libraries/LibSkill.sol";
import { LibSkillRegistry } from "libraries/LibSkillRegistry.sol";

/** @notice
 * Library for getting.
 */
library LibGetter {
  using LibString for string;

  ///////////////
  // TOP LEVEL

  /// @notice get the balance of X (type+index). can be any shape, but usually Account
  function getBal(
    IUintComp components,
    uint256 id,
    string memory _type,
    uint32 index
  ) public view returns (uint256 balance) {
    // change holderID to 0 for global scoped data
    if (_type.endsWith("GLOBAL")) id = 0;

    if (_type.eq("ITEM")) {
      balance = LibInventory.getBalanceOf(components, id, index);
    } else if (_type.eq("LEVEL")) {
      balance = LibExperience.getLevel(components, id);
    } else if (_type.eq("KAMI_NUM_OWNED")) {
      balance = LibAccount.getNumKamis(components, id);
    } else if (_type.eq("KAMI_LEVEL_HIGHEST")) {
      balance = getTopLevel(components, LibAccount.getKamis(components, id));
    } else if (_type.eq("KAMI_LEVEL_QUANTITY")) {
      balance = getMinLevelAmt(components, LibAccount.getKamis(components, id), index);
    } else if (_type.eq("SKILL")) {
      balance = LibSkill.getPointsOf(components, id, index);
    } else if (_type.eq("REPUTATION")) {
      balance = LibFaction.getRep(components, id, index);
    } else if (_type.eq("BLOCKTIME")) {
      balance = block.timestamp;
    } else {
      balance = LibData.get(components, id, index, _type);
    }
  }

  /// @notice gets bool value of X. can be any shape, but usually Account
  function getBool(
    IUintComp components,
    uint256 targetID,
    string memory _type,
    uint32 index,
    uint256 value
  ) public view returns (bool result) {
    if (_type.eq("COMPLETE_COMP")) {
      // check if entity has isCompleteComp, with expectedValue acting as entityID
      return IsCompleteComponent(getAddrByID(components, IsCompleteCompID)).has(value);
    } else if (_type.eq("QUEST")) {
      return LibQuest.checkAccQuestComplete(components, index, targetID);
    } else if (_type.eq("ROOM")) {
      return getRoom(components, targetID) == index;
    } else if (_type.eq("PHASE")) {
      return LibPhase.get(block.timestamp) == index;
    } else if (_type.eq("COOLDOWN")) {
      return LibCooldown.isActive(components, targetID);
    } else if (_type.eq("STATE")) {
      string memory entityType = LibEntityType.get(components, targetID);
      return index == getState(components, entityType, targetID);
    } else if (_type.eq("KAMI_CAN_EAT")) {
      // hardcoded.. until we have an OR condition that supports accepting RESTING or HARVESTING
      string memory state = LibKami.getState(components, targetID);
      return state.eq("RESTING") || state.eq("HARVESTING");
    } else {
      // add an additional type - componentID ('component.xx.xx') to change registry flags to IsComponents
      return LibFlag.has(components, targetID, _type); // default to flag
    }
  }

  ///////////////
  // SHAPE SPECIFIC GETTERS

  /// @dev checks for any many types of entity shapes. if shape is known beforehand, query account directly
  function getAccount(IUintComp components, uint256 id) internal view returns (uint256) {
    string memory shape = LibEntityType.get(components, id);

    if (shape.eq("ACCOUNT")) return id;
    else if (shape.eq("KAMI")) return LibKami.getAccount(components, id);
    else revert("LibGetter: invalid entity shape (no acc)");
  }

  /// @dev checks for any many types of entity shapes. if shape is known beforehand, query room directly
  function getRoom(IUintComp components, uint256 id) internal view returns (uint32) {
    string memory shape = LibEntityType.get(components, id);

    if (shape.eq("KAMI")) return LibKami.getRoom(components, id);
    else return LibRoom.get(components, id);
  }

  ///////////////
  // REGISTRIES

  /// @notice gets a registry ID from an index and type
  function getRegID(
    IUintComp components,
    string memory _type,
    uint32 index
  ) internal view returns (uint256) {
    if (_type.eq("FACTION")) return LibFaction.getByIndex(components, index);
    else if (_type.eq("GOAL")) return LibGoal.getByIndex(components, index);
    else if (_type.eq("ITEM")) return LibItem.getByIndex(components, index);
    else if (_type.eq("NODE")) return LibNode.getByIndex(components, index);
    else if (_type.eq("NPC")) return LibNPC.get(components, index);
    else if (_type.eq("QUEST")) return LibQuestRegistry.getByIndex(components, index);
    else if (_type.eq("ROOM")) return LibRoom.getByIndex(components, index);
    else if (_type.eq("SKILL")) return LibSkillRegistry.getByIndex(components, index);
  }

  ///////////////
  // INTERNAL

  function getTopLevel(IUintComp components, uint256[] memory ids) internal view returns (uint256) {
    uint256 highestLevel = 1;
    LevelComponent levelComp = LevelComponent(getAddrByID(components, LevelCompID));
    for (uint256 i = 0; i < ids.length; i++) {
      uint256 level = levelComp.get(ids[i]);
      if (level > highestLevel) highestLevel = level;
    }
    return highestLevel;
  }

  function getMinLevelAmt(
    IUintComp components,
    uint256[] memory ids,
    uint256 minLevel
  ) internal view returns (uint256) {
    uint256 total = 0;
    LevelComponent levelComp = LevelComponent(getAddrByID(components, LevelCompID));
    for (uint256 i = 0; i < ids.length; i++) {
      uint256 level = levelComp.get(ids[i]);
      if (level >= minLevel) total++;
    }
    return total;
  }

  function getState(
    IUintComp components,
    string memory entityType,
    uint256 id
  ) internal view returns (uint32) {
    if (entityType.eq("KAMI")) return LibKami.getStateIndex(components, id);
    else revert("LibGetter: invalid entity state type");
  }
}
