// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { Uint32BareComponent } from "solecs/components/Uint32BareComponent.sol"; // for index comps
import { IDFromComponent, ID as IDFromCompID } from "components/IDFromComponent.sol";
import { IDToComponent, ID as IDToCompID } from "components/IDToComponent.sol";

import { LibArray } from "libraries/utils/LibArray.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";

import { LibRoom } from "libraries/LibRoom.sol";

/** @notice
 * A relation that acts as an 'assigner' check; entity1 (assigner) can 'assign' an action(entity2, e.g. quest, crafting)
 *
 * this translates to a check, basically
 * - location check; entity1 and account must be in the same room
 *
 * Flow:
 * 1. Check if Action is universal
 * 2. Check if relation between Assigner and Action exists
 * 3. Perform assigner checks (shared location)
 *
 * Shape: id(hash("assigner", fromID, toID))
 * - IDFromComponent: fromID
 * - IDToComponent: toID
 * - XXIndex (e.g. QuestIndex): Optional, for easier FE lookup
 *
 * Universal Actions: some Actions don't have fixed assigners; they can be accepted anywhere
 * - check if ActionEntity has any reciving relations
 */
library LibAssigner {
  /////////////////
  // SHAPES

  function create(
    IUintComp components,
    uint256 assignerID, // fromID
    uint256 actionID // toID
  ) internal returns (uint256 id) {
    id = genID(assignerID, actionID);
    LibEntityType.set(components, id, "ASSIGNER");
    IDFromComponent(getAddrByID(components, IDFromCompID)).set(id, assignerID);
    IDToComponent(getAddrByID(components, IDToCompID)).set(id, actionID);
  }

  function addIndex(Uint32BareComponent indexComp, uint32 index, uint256 id) internal {
    indexComp.set(id, index);
  }

  function remove(IUintComp components, uint256 id) internal {
    LibEntityType.remove(components, id);
    IDFromComponent(getAddrByID(components, IDFromCompID)).remove(id);
    IDToComponent(getAddrByID(components, IDToCompID)).remove(id);
  }

  function remove(IUintComp components, Uint32BareComponent indexComp, uint256 id) internal {
    remove(components, id);
    indexComp.remove(id);
  }

  /////////////////
  // CHECKERS

  function check(
    IUintComp components,
    uint256 assignerID,
    uint256 actionID,
    uint256 accID
  ) internal view returns (bool) {
    // universal action check (no assigner)
    if (isUniversal(components, actionID)) return true;

    // check assigner between assigner and action
    if (get(components, assignerID, actionID) == 0) return false; // no relation

    // shared location check (could add general requirements in future)
    return LibRoom.sharesRoom(components, assignerID, accID);
  }

  function isUniversal(IUintComp components, uint256 actionID) internal view returns (bool) {
    return
      IDToComponent(getAddrByID(components, IDToCompID)).getEntitiesWithValue(actionID).length == 0;
  }

  /////////////////
  // GETTERS

  function get(
    IUintComp components,
    uint256 assignerID,
    uint256 actionID
  ) internal view returns (uint256) {
    uint256 id = genID(assignerID, actionID);
    return LibEntityType.isShape(components, id, "ASSIGNER") ? id : 0;
  }

  /// @notice gets all relations (to and from) an entity
  function getAll(IUintComp components, uint256 entity) internal view returns (uint256[] memory) {
    uint256[] memory from = getAllFrom(components, entity);
    uint256[] memory to = getAllTo(components, entity);
    return LibArray.concat(from, to);
  }

  function getAllFrom(
    IUintComp components,
    uint256 fromID
  ) internal view returns (uint256[] memory) {
    return IDFromComponent(getAddrByID(components, IDFromCompID)).getEntitiesWithValue(fromID);
  }

  function getAllTo(IUintComp components, uint256 toID) internal view returns (uint256[] memory) {
    return IDToComponent(getAddrByID(components, IDToCompID)).getEntitiesWithValue(toID);
  }

  ///////////////
  // UTILS

  function genID(uint256 fromID, uint256 toID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("assigner", fromID, toID)));
  }
}
