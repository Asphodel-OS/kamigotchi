// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRoom } from "libraries/LibRoom.sol";

uint256 constant ID = uint256(keccak256("system._Room.Set.Name"));

// update the name of an existing room, identified by its location
contract _RoomSetNameSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint256 location, string memory name) = abi.decode(arguments, (uint256, string));

    uint256 id = LibRoom.get(components, location);
    require(id != 0, "Room: does not exist");
    require(bytes(name).length > 0, "Room: name cannot be empty");

    LibRoom.setName(components, id, name);

    return "";
  }

  function executeTyped(
    uint256 location,
    string memory name
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(location, name));
  }
}
