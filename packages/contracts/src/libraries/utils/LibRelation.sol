// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { Uint256Component } from "components/base/Uint256Component.sol";

import { IDFromComponent, ID as IDFromCompID } from "components/IDFromComponent.sol";
import { IDToComponent, ID as IDToCompID } from "components/IDToComponent.sol";

import { LibArray } from "libraries/utils/LibArray.sol";

/** @notice
 * LibRelation handles a Relation, a shape that exists between two entities.
 * - Can exist between any two entities, although intended for Registries (reverse mappable writes)
 *   - possible BareRelation shape in future
 * - Directional
 *
 * Shape: id(entity1, entity2)
 * - IDFromComponent: entity1
 * - IDToComponent: entity2
 */
library LibRelation {
  /////////////////
  // SHAPES

  function create(
    IUintComp components,
    uint256 fromID,
    uint256 toID
  ) internal returns (uint256 id) {
    id = genID(fromID, toID);
    IDFromComponent(getAddrByID(components, IDFromCompID)).set(id, fromID);
    IDToComponent(getAddrByID(components, IDToCompID)).set(id, toID);
  }

  function remove(IUintComp components, uint256 id) internal {
    IDFromComponent(getAddrByID(components, IDFromCompID)).remove(id);
    IDToComponent(getAddrByID(components, IDToCompID)).remove(id);
  }

  /////////////////
  // GETTERS

  function get(IUintComp components, uint256 fromID, uint256 toID) internal view returns (uint256) {
    uint256 id = genID(fromID, toID);
    return IDFromComponent(getAddrByID(components, IDFromCompID)).has(id) ? id : 0;
  }

  /// @notice get, but with direct From/To components
  function getViaComp(
    Uint256Component comp,
    uint256 fromID,
    uint256 toID
  ) internal view returns (uint256) {
    uint256 id = genID(fromID, toID);
    return comp.has(id) ? id : 0;
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

  /////////////////
  // UTILS

  function genID(uint256 fromID, uint256 toID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("relation", fromID, toID)));
  }
}
