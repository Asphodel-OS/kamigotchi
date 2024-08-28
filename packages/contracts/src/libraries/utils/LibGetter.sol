// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";

import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IsCompleteComponent, ID as IsCompleteCompID } from "components/IsCompleteComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibPhase } from "libraries/utils/LibPhase.sol";
import { LibData } from "libraries/LibData.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibFactions } from "libraries/LibFactions.sol";
import { LibGoals } from "libraries/LibGoals.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibNPC } from "libraries/LibNPC.sol";
import { LibQuests } from "libraries/LibQuests.sol";
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
  function getBalanceOf(
    IUintComp components,
    uint256 id,
    string memory _type,
    uint32 index
  ) public view returns (uint256 balance) {
    if (_type.eq("ITEM")) {
      balance = LibInventory.getBalanceOf(components, id, index);
    } else if (_type.eq("LEVEL")) {
      balance = LibExperience.getLevel(components, id);
    } else if (_type.eq("KAMI")) {
      balance = LibAccount.getPetsOwned(components, id).length;
    } else if (_type.eq("KAMI_LEVEL_HIGHEST")) {
      balance = getTopLevel(components, LibAccount.getPetsOwned(components, id));
    } else if (_type.eq("SKILL")) {
      balance = LibSkill.getPointsOf(components, id, index);
    } else if (_type.eq("REPUTATION")) {
      balance = LibFactions.getRep(components, id, index);
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
  ) internal view returns (bool result) {
    if (_type.eq("COMPLETE_COMP")) {
      // check if entity has isCompleteComp, with expectedValue acting as entityID
      return IsCompleteComponent(getAddressById(components, IsCompleteCompID)).has(value);
    } else if (_type.eq("QUEST")) {
      return LibQuests.checkAccQuestComplete(components, index, targetID);
    } else if (_type.eq("ROOM")) {
      return LibRoom.getIndex(components, targetID) == index;
    } else if (_type.eq("PHASE")) {
      return LibPhase.get(block.timestamp) == index;
    } else {
      require(false, "Unknown bool condition type");
    }
  }

  ///////////////
  // REGISTRIES

  /// @notice gets a registry ID from an index and type
  function getRegID(
    IUintComp components,
    string memory _type,
    uint32 index
  ) internal view returns (uint256) {
    if (_type.eq("FACTION")) return LibFactions.getByIndex(components, index);
    else if (_type.eq("GOAL")) return LibGoals.getByIndex(components, index);
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
    LevelComponent levelComp = LevelComponent(getAddressById(components, LevelCompID));
    for (uint256 i = 0; i < ids.length; i++) {
      uint256 level = levelComp.get(ids[i]);
      if (level > highestLevel) highestLevel = level;
    }
    return highestLevel;
  }
}
