// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IDOwnsRelationshipComponent, ID as IDOwnsRSCompID } from "components/IDOwnsRelationshipComponent.sol";
import { IndexNPCComponent, ID as IndexNPCCompID } from "components/IndexNPCComponent.sol";
import { IndexRelationshipComponent, ID as IndexRelCompID } from "components/IndexRelationshipComponent.sol";
import { IsRelationshipComponent, ID as IsRelCompID } from "components/IsRelationshipComponent.sol";

import { LibRelationshipRegistry } from "libraries/LibRelationshipRegistry.sol";

library LibRelationship {
  /////////////////
  // INTERACTIONS

  function create(
    IUintComp components,
    uint256 accountID,
    uint32 npcIndex,
    uint32 relIndex
  ) internal returns (uint256) {
    uint256 id = genID(accountID, npcIndex, relIndex);
    IsRelationshipComponent(getAddressById(components, IsRelCompID)).set(id);
    IDOwnsRelationshipComponent(getAddressById(components, IDOwnsRSCompID)).set(id, accountID);
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
    uint32 npcIndex,
    uint32 relIndex
  ) internal view returns (bool) {
    uint256 registryID = LibRelationshipRegistry.get(components, npcIndex, relIndex);
    if (isBlacklisted(components, accountID, registryID)) return false;
    if (isWhitelisted(components, accountID, registryID)) return true;
    return false;
  }

  // Check whether an account has a specific relationship flag.
  function has(
    IUintComp components,
    uint256 accountID,
    uint32 npcIndex,
    uint32 relIndex
  ) internal view returns (bool) {
    return get(components, accountID, npcIndex, relIndex) != 0;
  }

  // Check whether an account is blacklisted from advancing to a specific relationship flag.
  function isBlacklisted(
    IUintComp components,
    uint256 accountID,
    uint256 registryID
  ) internal view returns (bool) {
    uint32[] memory blacklist = LibRelationshipRegistry.getBlacklist(components, registryID);
    uint32 npcIndex = LibRelationshipRegistry.getNpcIndex(components, registryID);
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
    uint32[] memory whitelist = LibRelationshipRegistry.getWhitelist(components, registryID);
    uint32 npcIndex = LibRelationshipRegistry.getNpcIndex(components, registryID);
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
    uint32 npcIndex,
    uint32 relIndex
  ) internal view returns (uint256 result) {
    uint256 id = genID(accountID, npcIndex, relIndex);
    return LibRelationshipRegistry.isRelationship(components, id) ? id : 0;
  }

  /////////////////
  //  UTILS

  function genID(uint256 accID, uint32 npcIndex, uint32 relIndex) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("relationship", accID, npcIndex, relIndex)));
  }
}
