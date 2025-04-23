// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { IndexNPCComponent, ID as IndexNPCCompID } from "components/IndexNPCComponent.sol";
import { IndexRelationshipComponent, ID as IndexRelCompID } from "components/IndexRelationshipComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { BlacklistComponent, ID as BlacklistCompID } from "components/BlacklistComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { WhitelistComponent, ID as WhitelistCompID } from "components/WhitelistComponent.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";

// This library contains functions for interacting with the Relationship Registry.
// The registry determines how players can navigate relationships with NPCs.
library LibRelationshipRegistry {
  /////////////////
  // INTERACTIONS

  // Create a Registry entry for a Relationship.
  // unlike other registry entities, this one has a dual key of npcIndex and relIndex
  function create(
    IUintComp components,
    uint32 npcIndex,
    uint32 relIndex
  ) internal returns (uint256) {
    uint256 id = genID(npcIndex, relIndex);
    LibEntityType.set(components, id, "RELATIONSHIP");
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).set(id);
    IndexNPCComponent(getAddrByID(components, IndexNPCCompID)).set(id, npcIndex);
    IndexRelationshipComponent(getAddrByID(components, IndexRelCompID)).set(id, relIndex);
    return id;
  }

  // Delete a Registry entry for a Relationship.
  function delete_(IUintComp components, uint256 id) internal {
    removeIsRegistry(components, id);
    removeIsRelationship(components, id);
    removeRelationshipIndex(components, id);
    removeNPCIndex(components, id);
    removeName(components, id);
    removeBlacklist(components, id);
    removeWhitelist(components, id);
  }

  /////////////////
  // CHECKERS

  function hasBlacklist(IUintComp components, uint256 id) internal view returns (bool) {
    return BlacklistComponent(getAddrByID(components, BlacklistCompID)).has(id);
  }

  function hasWhitelist(IUintComp components, uint256 id) internal view returns (bool) {
    return WhitelistComponent(getAddrByID(components, WhitelistCompID)).has(id);
  }

  function hasName(IUintComp components, uint256 id) internal view returns (bool) {
    return NameComponent(getAddrByID(components, NameCompID)).has(id);
  }

  function exists(
    IUintComp components,
    uint32 npcIndex,
    uint32 relIndex
  ) internal view returns (bool) {
    return get(components, npcIndex, relIndex) != 0;
  }

  /////////////////
  // SETTERS

  function setBlacklist(IUintComp components, uint256 id, uint32[] memory value) internal {
    BlacklistComponent(getAddrByID(components, BlacklistCompID)).set(id, value);
  }

  function setWhitelist(IUintComp components, uint256 id, uint32[] memory value) internal {
    WhitelistComponent(getAddrByID(components, WhitelistCompID)).set(id, value);
  }

  function setName(IUintComp components, uint256 id, string memory value) internal {
    NameComponent(getAddrByID(components, NameCompID)).set(id, value);
  }

  /////////////////
  // GETTERS

  function isRelationship(IUintComp components, uint256 id) internal view returns (bool) {
    return LibEntityType.isShape(components, id, "RELATIONSHIP");
  }

  function getNpcIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexNPCComponent(getAddrByID(components, IndexNPCCompID)).get(id);
  }

  function getRelationshipIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexRelationshipComponent(getAddrByID(components, IndexRelCompID)).get(id);
  }

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    if (!hasName(components, id)) return "";
    return NameComponent(getAddrByID(components, NameCompID)).get(id);
  }

  function getBlacklist(IUintComp components, uint256 id) internal view returns (uint32[] memory) {
    if (!hasBlacklist(components, id)) return new uint32[](0);
    return BlacklistComponent(getAddrByID(components, BlacklistCompID)).get(id);
  }

  function getWhitelist(IUintComp components, uint256 id) internal view returns (uint32[] memory) {
    if (!hasWhitelist(components, id)) return new uint32[](0);
    return WhitelistComponent(getAddrByID(components, WhitelistCompID)).get(id);
  }

  /////////////////
  // REMOVERS

  function removeIsRegistry(IUintComp components, uint256 id) internal {
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).remove(id);
  }

  function removeIsRelationship(IUintComp components, uint256 id) internal {
    LibEntityType.remove(components, id);
  }

  function removeRelationshipIndex(IUintComp components, uint256 id) internal {
    IndexRelationshipComponent(getAddrByID(components, IndexRelCompID)).remove(id);
  }

  function removeNPCIndex(IUintComp components, uint256 id) internal {
    IndexNPCComponent(getAddrByID(components, IndexNPCCompID)).remove(id);
  }

  function removeName(IUintComp components, uint256 id) internal {
    if (hasName(components, id)) NameComponent(getAddrByID(components, NameCompID)).remove(id);
  }

  function removeBlacklist(IUintComp components, uint256 id) internal {
    if (hasBlacklist(components, id))
      BlacklistComponent(getAddrByID(components, BlacklistCompID)).remove(id);
  }

  function removeWhitelist(IUintComp components, uint256 id) internal {
    if (hasWhitelist(components, id))
      WhitelistComponent(getAddrByID(components, WhitelistCompID)).remove(id);
  }

  /////////////////
  // QUERIES

  // Get a Relationship Registry Entity by its RelationshipIndex and NPCIndex.
  function get(
    IUintComp components,
    uint32 npcIndex,
    uint32 relIndex
  ) internal view returns (uint256) {
    uint256 id = genID(npcIndex, relIndex);
    return isRelationship(components, id) ? id : 0;
  }

  /////////////////
  // UTILS

  function genID(uint32 npcIndex, uint32 relIndex) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("registry.relationship", npcIndex, relIndex)));
  }
}
