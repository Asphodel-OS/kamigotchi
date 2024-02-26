// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibNPC } from "libraries/LibNPC.sol";

uint256 constant ID = uint256(keccak256("system._NPC.Set.Room"));

// set the RoomIndex of a NPC, identified by its NPC Index
contract _NPCSetRoomSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint256 index, uint256 roomIndex) = abi.decode(arguments, (uint256, uint256));
    uint256 id = LibNPC.getByIndex(components, index);

    require(id != 0, "NPC: does not exist");

    LibNPC.setRoomIndex(components, id, roomIndex);
    return "";
  }

  function executeTyped(uint256 index, uint256 roomIndex) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, roomIndex));
  }
}
