// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRegistryRelationship as LibRegRel } from "libraries/LibRegistryRelationship.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Relationship.Delete"));

// _RegistryDeleteRelationshipSystem updates a relationship registry entry's optional fields
// Q(ja): should we delete players' relationships as well by default.. maybe a flag?
contract _RegistryDeleteRelationshipSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint256 npcIndex, uint256 relIndex) = abi.decode(arguments, (uint256, uint256));
    uint256 registryID = LibRegRel.get(components, npcIndex, relIndex);

    require(registryID != 0, "RegistryDeleteRelationship: flag does not exist");

    LibRegRel.delete_(components, registryID);

    return "";
  }

  function executeTyped(uint256 npcIndex, uint256 index) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(npcIndex, index));
  }
}
