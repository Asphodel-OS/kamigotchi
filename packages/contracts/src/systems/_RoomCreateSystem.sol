// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { Location, LibRoom } from "libraries/LibRoom.sol";

uint256 constant ID = uint256(keccak256("system._Room.Create"));

// create a room within the world
contract _RoomCreateSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      Location memory location,
      uint32 index,
      string memory name,
      string memory description,
      uint32[] memory exits
    ) = abi.decode(arguments, (Location, uint32, string, string, uint32[]));

    require(LibRoom.queryByLocation(components, location) == 0, "Room: already exists at location");
    require(LibRoom.queryByIndex(components, index) == 0, "Room: already exists at index");
    require(bytes(name).length > 0, "Room: name cannot be empty");

    uint256 id = LibRoom.create(components, location, index, name, description);
    if (exits.length > 0 && exits[0] != 0) LibRoom.setExits(components, id, exits);

    return abi.encode(id);
  }

  function executeTyped(
    Location memory location,
    uint32 index,
    string memory name,
    string memory description,
    uint32[] memory exits
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(location, index, name, description, exits));
  }
}
