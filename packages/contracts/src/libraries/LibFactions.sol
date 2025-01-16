// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { DescriptionComponent, ID as DescriptionCompID } from "components/DescriptionComponent.sol";
import { IndexFactionComponent, ID as IndexFactionCompID } from "components/IndexFactionComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibScore } from "libraries/LibScore.sol";

/** @notice
 * Factions are entites (primarily NPCs, but potentially players and more) can belong to.
 *
 * On other entities: factions are represented by IndexFactionComponent
 * Registries are used to store metadata + a "meta-entity" to store coins, inventories, etc.
 * Registry shape:
 * - ID: hash("faction", factionIndex)
 * - IsRegistryComp
 * - IndexFactionComponent
 * - NameComponent
 * - MediaURIComponent
 *
 * Entities can have Reputation with factions.
 *   - stored as a ScoreEntity (reverse map for FE leaderboards)
 *     - id = hash("faction.reputation", factionID)
 *     - TypeID = factionID
 */
library LibFactions {
  /////////////////
  // SHAPES

  /// @notice creates a faction entity. only one exists per world
  function create(
    IUintComp components,
    uint32 index,
    string memory name,
    string memory description,
    string memory mediaURI
  ) internal returns (uint256 id) {
    id = genID(index);
    LibEntityType.set(components, id, "FACTION");

    IsRegistryComponent(getAddrByID(components, IsRegCompID)).set(id);
    IndexFactionComponent(getAddrByID(components, IndexFactionCompID)).set(id, index);
    NameComponent(getAddrByID(components, NameCompID)).set(id, name);
    DescriptionComponent(getAddrByID(components, DescriptionCompID)).set(id, description);
    MediaURIComponent(getAddrByID(components, MediaURICompID)).set(id, mediaURI);
  }

  function remove(IUintComp components, uint256 targetID) internal {
    LibEntityType.remove(components, targetID);

    IsRegistryComponent(getAddrByID(components, IsRegCompID)).remove(targetID);
    IndexFactionComponent(getAddrByID(components, IndexFactionCompID)).remove(targetID);
    NameComponent(getAddrByID(components, NameCompID)).remove(targetID);
    DescriptionComponent(getAddrByID(components, DescriptionCompID)).remove(targetID);
    MediaURIComponent(getAddrByID(components, MediaURICompID)).remove(targetID);
  }

  /////////////////
  // INTERACTIONS

  /// @notice assign faction id to a target entity
  /// @dev only for NPCs now, but could be extended to any entity
  function assign(IUintComp components, uint256 targetID, uint32 index) internal {
    IndexFactionComponent(getAddrByID(components, IndexFactionCompID)).set(targetID, index);
  }

  function incRep(IUintComp components, uint256 targetID, uint32 index, uint256 amt) internal {
    uint256 id = genRepID(targetID, index);
    uint256 factionID = genID(index);
    LibScore.incFor(components, id, targetID, factionID, amt);
  }

  function decRep(IUintComp components, uint256 targetID, uint32 index, uint256 amt) internal {
    uint256 id = genRepID(targetID, index);
    uint256 factionID = genID(index);
    LibScore.decFor(components, id, targetID, factionID, amt);
  }

  /////////////////
  // GETTERS

  function getRep(
    IUintComp components,
    uint256 targetID,
    uint32 index
  ) internal view returns (uint256) {
    uint256 id = genRepID(targetID, index);
    return LibScore.get(components, id);
  }

  function getByIndex(IUintComp components, uint32 index) internal view returns (uint256) {
    uint256 id = genID(index);
    if (IndexFactionComponent(getAddrByID(components, IndexFactionCompID)).has(id)) return id;
  }

  /////////////////
  // UTILS

  /// @notice generates the faction metaentity id
  function genID(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("faction", index)));
  }

  /// @notice generates faction reputation ID
  function genRepID(uint256 holderID, uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("faction.reputation", holderID, index)));
  }
}
