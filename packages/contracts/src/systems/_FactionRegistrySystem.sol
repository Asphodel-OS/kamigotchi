// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibFactions } from "libraries/LibFactions.sol";

uint256 constant ID = uint256(keccak256("system.faction.registry"));

contract _FactionRegistrySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function create(bytes memory arguments) public onlyOwner returns (uint256) {
    (uint32 index, string memory name, string memory description, string memory mediaURI) = abi
      .decode(arguments, (uint32, string, string, string));

    require(LibFactions.getByIndex(components, index) == 0, "Faction already exists");

    return LibFactions.create(components, index, name, description, mediaURI);
  }

  function remove(uint32 index) public onlyOwner {
    uint256 factionID = LibFactions.getByIndex(components, index);
    require(factionID != 0, "Faction does not exist");

    LibFactions.remove(components, factionID);
  }

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    require(false, "not implemented");
  }
}
