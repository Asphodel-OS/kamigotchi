// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { IDOwnsRelationshipComponent, ID as IDOwnsRSCompID } from "components/IDOwnsRelationshipComponent.sol";
import { IndexNPCComponent, ID as IndexNPCCompID } from "components/IndexNPCComponent.sol";
import { IndexRelationshipComponent, ID as IndexRelCompID } from "components/IndexRelationshipComponent.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";

import { LibRelationshipRegistry } from "libraries/LibRelationshipRegistry.sol";

library LibRelationship {
  /////////////////
  // INTERACTIONS

  function create(
    IUintComp components,
    uint256 accID,
    uint32 npcIndex,
    uint32 relIndex
  ) internal returns (uint256) {
    uint256 id = genID(accID, npcIndex, relIndex);
    LibEntityType.set(components, id, "RELATIONSHIP");
    IDOwnsRelationshipComponent(getAddrByID(components, IDOwnsRSCompID)).set(id, accID);
    IndexNPCComponent(getAddrByID(components, IndexNPCCompID)).set(id, npcIndex);
    IndexRelationshipComponent(getAddrByID(components, IndexRelCompID)).set(id, relIndex);
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
    uint256 accID,
    uint32 npcIndex,
    uint32 relIndex
  ) internal view returns (bool) {
    uint256 registryID = LibRelationshipRegistry.get(components, npcIndex, relIndex);
    if (isBlacklisted(components, accID, registryID)) return false;
    if (isWhitelisted(components, accID, registryID)) return true;
    return false;
  }

  // Check whether an account has a specific relationship flag.
  function has(
    IUintComp components,
    uint256 accID,
    uint32 npcIndex,
    uint32 relIndex
  ) internal view returns (bool) {
    return get(components, accID, npcIndex, relIndex) != 0;
  }

  // Check whether an account is blacklisted from advancing to a specific relationship flag.
  function isBlacklisted(
    IUintComp components,
    uint256 accID,
    uint256 registryID
  ) internal view returns (bool) {
    uint32[] memory blacklist = LibRelationshipRegistry.getBlacklist(components, registryID);
    uint32 npcIndex = LibRelationshipRegistry.getNpcIndex(components, registryID);
    for (uint256 i = 0; i < blacklist.length; i++) {
      if (has(components, accID, npcIndex, blacklist[i])) return true;
    }
    return false;
  }

  // Check whether an account is whitelisted to advance to a specific relationship flag.
  // If the whitelist is empty, the relationship advancement is valid.
  function isWhitelisted(
    IUintComp components,
    uint256 accID,
    uint256 registryID
  ) internal view returns (bool) {
    uint32[] memory whitelist = LibRelationshipRegistry.getWhitelist(components, registryID);
    uint32 npcIndex = LibRelationshipRegistry.getNpcIndex(components, registryID);
    if (whitelist.length == 0) return true;
    for (uint256 i = 0; i < whitelist.length; i++) {
      if (has(components, accID, npcIndex, whitelist[i])) return true;
    }
    return false;
  }

  /////////////////
  //  QUERIES

  function get(
    IUintComp components,
    uint256 accID,
    uint32 npcIndex,
    uint32 relIndex
  ) internal view returns (uint256 result) {
    uint256 id = genID(accID, npcIndex, relIndex);
    return LibRelationshipRegistry.isRelationship(components, id) ? id : 0;
  }

  /////////////////
  //  UTILS

  function genID(uint256 accID, uint32 npcIndex, uint32 relIndex) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("relationship", accID, npcIndex, relIndex)));
  }
}
