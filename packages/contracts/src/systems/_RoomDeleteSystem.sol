// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRoom } from "libraries/LibRoom.sol";

uint256 constant ID = uint256(keccak256("system._Room.Delete"));

// create a room within the world
contract _RoomDeleteSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    uint256 location = abi.decode(arguments, (uint256));

    uint256 roomID = LibRoom.get(components, location);
    require(roomID != 0, "Room: location does not exist");

    LibRoom.remove(components, roomID);

    return "";
  }

  function executeTyped(uint256 location) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(location));
  }
}
