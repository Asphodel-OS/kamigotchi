// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { Uint32BareComponent } from "components/base/Uint32BareComponent.sol"; // for index comps
import { IDToComponent, ID as IDToCompID } from "components/IDToComponent.sol";

import { LibRelation } from "libraries/utils/LibRelation.sol";
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
 * Shape: id(LibRelation)
 * - Base relation shape
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
    uint256 assignerID,
    uint256 actionID
  ) internal returns (uint256 id) {
    id = LibRelation.create(components, assignerID, actionID);
  }

  function addIndex(Uint32BareComponent indexComp, uint32 index, uint256 id) internal {
    indexComp.set(id, index);
  }

  function remove(IUintComp components, uint256 id) internal {
    LibRelation.remove(components, id);
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
    // universal action check
    IDToComponent toComp = IDToComponent(getAddressById(components, IDToCompID));
    if (isUniversal(toComp, actionID)) return true;

    uint256 relationID = LibRelation.getViaComp(toComp, assignerID, actionID);
    if (relationID == 0) return false; // no relation

    // shared location check (could add general requirements in future)
    return LibRoom.sharesRoom(components, assignerID, accID);
  }

  function isUniversal(IDToComponent toComp, uint256 actionID) internal view returns (bool) {
    return toComp.getEntitiesWithValue(actionID).length == 0;
  }

  /////////////////
  // GETTERS

  /// @notice gets all relations (to and from) an entity
  function getAll(IUintComp components, uint256 entity) internal view returns (uint256[] memory) {
    return LibRelation.getAll(components, entity);
  }
}
