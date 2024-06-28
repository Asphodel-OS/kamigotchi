// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibNPC } from "libraries/LibNPC.sol";

uint256 constant ID = uint256(keccak256("system.npc.registry"));

// create a NPC as specified
contract _NPCRegistrySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function create(bytes memory arguments) public onlyOwner returns (uint256) {
    (uint32 index, string memory name, uint32 roomIndex) = abi.decode(
      arguments,
      (uint32, string, uint32)
    );

    uint256 id = LibNPC.getByIndex(components, index);
    require(id == 0, "NPC: already exists");

    return LibNPC.create(components, index, name, roomIndex);
  }

  function setName(uint32 index, string memory name) public onlyOwner {
    uint256 id = LibNPC.getByIndex(components, index);
    require(id != 0, "NPC: does not exist");

    LibNPC.setName(components, id, name);
  }

  function setRoom(uint32 index, uint32 roomIndex) public onlyOwner {
    uint256 id = LibNPC.getByIndex(components, index);
    require(id != 0, "NPC: does not exist");

    LibNPC.setRoomIndex(components, id, roomIndex);
  }

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    require(false, "not implemented");
  }
}
