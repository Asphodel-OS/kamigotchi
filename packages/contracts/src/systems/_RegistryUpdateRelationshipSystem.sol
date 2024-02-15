// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRegistryRelationship as LibRegRel } from "libraries/LibRegistryRelationship.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Relationship.Update"));

// _RegistryUpdateRelationshipSystem updates a relationship registry entry's optional fields
contract _RegistryUpdateRelationshipSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
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
    return "";
  }

  function executeTyped(
    uint32 npcIndex,
    uint32 relIndex,
    string memory name,
    uint32[] memory whitelist,
    uint32[] memory blacklist
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(npcIndex, relIndex, name, whitelist, blacklist));
  }
}
