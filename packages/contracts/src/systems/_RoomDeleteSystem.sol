// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { Location, LibRoom } from "libraries/LibRoom.sol";

uint256 constant ID = uint256(keccak256("system._Room.Delete"));

// delete a room within the world
contract _RoomDeleteSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    uint32 index = abi.decode(arguments, (uint32));

    uint256 roomID = LibRoom.queryByIndex(components, index);
    require(roomID != 0, "Room: does not exist");

    LibRoom.remove(components, roomID);
    uint256[] memory gates = LibRoom.queryAllGates(components, index);
    for (uint256 i = 0; i < gates.length; i++) LibRoom.remove(components, gates[i]);

    return "";
  }

  function executeTyped(uint32 index) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index));
  }
}
