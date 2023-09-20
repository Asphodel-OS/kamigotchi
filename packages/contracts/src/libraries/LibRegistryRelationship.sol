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
    uint256 relationshipIndex
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
    IsRelationshipComponent(getAddressById(components, IsRelCompID)).set(id);
    setNpcIndex(components, id, npcIndex);
    setRelationshipIndex(components, id, relationshipIndex);
    return id;
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

  /////////////////
  // SETTERS

  function setNpcIndex(IUintComp components, uint256 id, uint256 value) internal {
    IndexNPCComponent(getAddressById(components, IndexNPCCompID)).set(id, value);
  }

  function setRelationshipIndex(IUintComp components, uint256 id, uint256 value) internal {
    IndexRelationshipComponent(getAddressById(components, IndexRelCompID)).set(id, value);
  }

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

  function getBlacklist(IUintComp components, uint256 id) internal view returns (uint256[] memory) {
    if (!hasBlacklist(components, id)) return new uint256[](0);
    return BlacklistComponent(getAddressById(components, BlacklistCompID)).getValue(id);
  }

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    if (!hasName(components, id)) return "";
    return NameComponent(getAddressById(components, NameCompID)).getValue(id);
  }

  function getWhitelist(IUintComp components, uint256 id) internal view returns (uint256[] memory) {
    if (!hasBlacklist(components, id)) return new uint256[](0);
    return WhitelistComponent(getAddressById(components, WhitelistCompID)).getValue(id);
  }

  /////////////////
  // QUERIES

  // Get a Relationship Registry Entity by its RelationshipIndex and NPCIndex.
  function get(
    IUintComp components,
    uint256 index,
    uint256 npcIndex
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IsRelCompID),
      abi.encode(index)
    );
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IsRegCompID),
      abi.encode(npcIndex)
    );
    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }
}
