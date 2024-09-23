// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibRelationshipRegistry as LibRegRel } from "libraries/LibRelationshipRegistry.sol";

uint256 constant ID = uint256(keccak256("system.relationship.registry"));

contract _RelationshipRegistrySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function create(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 npcIndex,
      uint32 relIndex,
      string memory name,
      uint32[] memory whitelist,
      uint32[] memory blacklist
    ) = abi.decode(arguments, (uint32, uint32, string, uint32[], uint32[]));
    uint256 registryID = LibRegRel.get(components, npcIndex, relIndex);

    require(registryID == 0, "Registry: Relationship already exists");

    registryID = LibRegRel.create(components, npcIndex, relIndex);
    if (!LibString.eq(name, "")) LibRegRel.setName(components, registryID, name);
    if (blacklist.length > 0) LibRegRel.setBlacklist(components, registryID, blacklist);
    if (whitelist.length > 0) LibRegRel.setWhitelist(components, registryID, whitelist);
    return registryID;
  }

  function update(bytes memory arguments) public onlyOwner {
    (
      uint32 npcIndex,
      uint32 relIndex,
      string memory name,
      uint32[] memory whitelist,
      uint32[] memory blacklist
    ) = abi.decode(arguments, (uint32, uint32, string, uint32[], uint32[]));
    uint256 registryID = LibRegRel.get(components, npcIndex, relIndex);

    require(registryID != 0, "RegistryUpdateRelationship: flag does not exist");

    if (!LibString.eq(name, "")) LibRegRel.setName(components, registryID, name);
    if (blacklist.length > 0) LibRegRel.setBlacklist(components, registryID, blacklist);
    if (whitelist.length > 0) LibRegRel.setWhitelist(components, registryID, whitelist);
  }

  function remove(uint32 npcIndex, uint32 relIndex) public onlyOwner {
    uint256 registryID = LibRegRel.get(components, npcIndex, relIndex);
    require(registryID != 0, "RegistryDeleteRelationship: flag does not exist");

    LibRegRel.delete_(components, registryID);
  }

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    require(false, "not implemented");
  }
}
