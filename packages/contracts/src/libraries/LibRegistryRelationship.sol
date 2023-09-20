// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IndexNPCComponent, ID as IndexNPCCompID } from "components/IndexNPCComponent.sol";
import { IndexRelationshipComponent, ID as IndexRelCompID } from "components/IndexRelationshipComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { IsRelationshipComponent, ID as IsRelCompID } from "components/IsRelationshipComponent.sol";
import { BlacklistComponent, ID as BlacklistCompID } from "components/BlacklistComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { WhitelistComponent, ID as WhitelistCompID } from "components/WhitelistComponent.sol";

// This library contains functions for interacting with the Relationship Registry.
// The registry determines how players can navigate relationships with NPCs.
library LibRegistryRelationship {
  /////////////////
  // INTERACTIONS

  // Create a Registry entry for a Relationship.
  function create(
    IWorld world,
    IUintComp components,
    uint256 npcIndex,
    uint256 relIndex
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    IsRelationshipComponent(getAddressById(components, IsRelCompID)).set(id);
    IndexNPCComponent(getAddressById(components, IndexNPCCompID)).set(id, npcIndex);
    IndexRelationshipComponent(getAddressById(components, IndexRelCompID)).set(id, relIndex);
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
    return BlacklistComponent(getAddressById(components, BlacklistCompID)).has(id);
  }

  function hasWhitelist(IUintComp components, uint256 id) internal view returns (bool) {
    return WhitelistComponent(getAddressById(components, WhitelistCompID)).has(id);
  }

  function hasName(IUintComp components, uint256 id) internal view returns (bool) {
    return NameComponent(getAddressById(components, NameCompID)).has(id);
  }

  function exists(
    IUintComp components,
    uint256 indexNPC,
    uint256 indexRel
  ) internal view returns (bool) {
    return get(components, indexNPC, indexRel) != 0;
  }

  /////////////////
  // SETTERS

  function setBlacklist(IUintComp components, uint256 id, uint256[] memory value) internal {
    BlacklistComponent(getAddressById(components, BlacklistCompID)).set(id, value);
  }

  function setWhitelist(IUintComp components, uint256 id, uint256[] memory value) internal {
    WhitelistComponent(getAddressById(components, WhitelistCompID)).set(id, value);
  }

  function setName(IUintComp components, uint256 id, string memory value) internal {
    NameComponent(getAddressById(components, NameCompID)).set(id, value);
  }

  /////////////////
  // GETTERS

  function getNpcIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexNPCComponent(getAddressById(components, IndexNPCCompID)).getValue(id);
  }

  function getRelationshipIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexRelationshipComponent(getAddressById(components, IndexRelCompID)).getValue(id);
  }

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    if (!hasName(components, id)) return "";
    return NameComponent(getAddressById(components, NameCompID)).getValue(id);
  }

  function getBlacklist(IUintComp components, uint256 id) internal view returns (uint256[] memory) {
    if (!hasBlacklist(components, id)) return new uint256[](0);
    return BlacklistComponent(getAddressById(components, BlacklistCompID)).getValue(id);
  }

  function getWhitelist(IUintComp components, uint256 id) internal view returns (uint256[] memory) {
    if (!hasWhitelist(components, id)) return new uint256[](0);
    return WhitelistComponent(getAddressById(components, WhitelistCompID)).getValue(id);
  }

  /////////////////
  // REMOVERS

  function removeIsRegistry(IUintComp components, uint256 id) internal {
    IsRegistryComponent(getAddressById(components, IsRegCompID)).remove(id);
  }

  function removeIsRelationship(IUintComp components, uint256 id) internal {
    IsRelationshipComponent(getAddressById(components, IsRelCompID)).remove(id);
  }

  function removeRelationshipIndex(IUintComp components, uint256 id) internal {
    IndexRelationshipComponent(getAddressById(components, IndexRelCompID)).remove(id);
  }

  function removeNPCIndex(IUintComp components, uint256 id) internal {
    IndexNPCComponent(getAddressById(components, IndexNPCCompID)).remove(id);
  }

  function removeName(IUintComp components, uint256 id) internal {
    if (hasName(components, id)) NameComponent(getAddressById(components, NameCompID)).remove(id);
  }

  function removeBlacklist(IUintComp components, uint256 id) internal {
    if (hasBlacklist(components, id))
      BlacklistComponent(getAddressById(components, BlacklistCompID)).remove(id);
  }

  function removeWhitelist(IUintComp components, uint256 id) internal {
    if (hasWhitelist(components, id))
      WhitelistComponent(getAddressById(components, WhitelistCompID)).remove(id);
  }

  /////////////////
  // QUERIES

  // Get a Relationship Registry Entity by its RelationshipIndex and NPCIndex.
  function get(
    IUintComp components,
    uint256 npcIndex,
    uint256 relIndex
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](4);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IsRelCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexNPCCompID),
      abi.encode(npcIndex)
    );
    fragments[3] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexRelCompID),
      abi.encode(relIndex)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }
}
