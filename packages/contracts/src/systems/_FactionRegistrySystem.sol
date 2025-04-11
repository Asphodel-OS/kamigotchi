// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { LibFaction } from "libraries/LibFaction.sol";

uint256 constant ID = uint256(keccak256("system.faction.registry"));

contract _FactionRegistrySystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function create(bytes memory arguments) public onlyAdmin(components) returns (uint256) {
    (uint32 index, string memory name, string memory description, string memory mediaURI) = abi
      .decode(arguments, (uint32, string, string, string));

    require(LibFaction.getByIndex(components, index) == 0, "Faction already exists");

    return LibFaction.create(components, index, name, description, mediaURI);
  }

  function remove(uint32 index) public onlyAdmin(components) {
    uint256 factionID = LibFaction.getByIndex(components, index);
    require(factionID != 0, "Faction does not exist");

    LibFaction.remove(components, factionID);
  }

  function execute(bytes memory arguments) public onlyAdmin(components) returns (bytes memory) {
    require(false, "not implemented");
  }
}
