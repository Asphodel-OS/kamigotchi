// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IdAccountComponent, ID as IdAccCompID } from "components/IdAccountComponent.sol";
import { IndexNPCComponent, ID as IndexNPCCompID } from "components/IndexNPCComponent.sol";
import { IndexRelationshipComponent, ID as IndexRelCompID } from "components/IndexRelationshipComponent.sol";
import { IsRelationshipComponent, ID as IsRelCompID } from "components/IsRelationshipComponent.sol";

import { LibRegistryRelationship } from "libraries/LibRegistryRelationship.sol";

library LibRelationship {
  /////////////////
  // INTERACTIONS

  function create(
    IWorld world,
    IUintComp components,
    uint256 accountID,
    uint256 npcIndex,
    uint256 relIndex
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsRelationshipComponent(getAddressById(components, IsRelCompID)).set(id);
    IdAccountComponent(getAddressById(components, IdAccCompID)).set(id, accountID);
    IndexNPCComponent(getAddressById(components, IndexNPCCompID)).set(id, npcIndex);
    IndexRelationshipComponent(getAddressById(components, IndexRelCompID)).set(id, relIndex);
    return id;
  }

  /////////////////
  // CHECKERS

  // Check whether an account can advance to a specific relationship flag with an NPC.
  // Assume the flag exists and the account doesnt already have it.
  // Any blacklist flags immediately invalidate the relationship advancement.
  // Any whitelist flags immediately validate the relationship advancement.
  function canCreate(
    IUintComp components,
    uint256 accountID,
    uint256 npcIndex,
    uint256 relIndex
  ) internal view returns (bool) {
    uint256 registryID = LibRegistryRelationship.get(components, npcIndex, relIndex);
    if (isBlacklisted(components, accountID, registryID)) return false;
    if (isWhitelisted(components, accountID, registryID)) return true;
    return false;
  }

  // Check whether an account has a specific relationship flag.
  function has(
    IUintComp components,
    uint256 accountID,
    uint256 npcIndex,
    uint256 relIndex
  ) internal view returns (bool) {
    return get(components, accountID, npcIndex, relIndex) != 0;
  }

  // Check whether an account is blacklisted from advancing to a specific relationship flag.
  function isBlacklisted(
    IUintComp components,
    uint256 accountID,
    uint256 registryID
  ) internal view returns (bool) {
    uint256[] memory blacklist = LibRegistryRelationship.getBlacklist(components, registryID);
    uint256 npcIndex = LibRegistryRelationship.getNpcIndex(components, registryID);
    for (uint256 i = 0; i < blacklist.length; i++) {
      if (has(components, accountID, npcIndex, blacklist[i])) return true;
    }
    return false;
  }

  // Check whether an account is whitelisted to advance to a specific relationship flag.
  // If the whitelist is empty, the relationship advancement is valid.
  function isWhitelisted(
    IUintComp components,
    uint256 accountID,
    uint256 registryID
  ) internal view returns (bool) {
    uint256[] memory whitelist = LibRegistryRelationship.getWhitelist(components, registryID);
    uint256 npcIndex = LibRegistryRelationship.getNpcIndex(components, registryID);
    if (whitelist.length == 0) return true;
    for (uint256 i = 0; i < whitelist.length; i++) {
      if (has(components, accountID, npcIndex, whitelist[i])) return true;
    }
    return false;
  }

  /////////////////
  //  QUERIES

  function get(
    IUintComp components,
    uint256 accountID,
    uint256 npcIndex,
    uint256 relIndex
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](4);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRelCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdAccCompID),
      abi.encode(accountID)
    );
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
