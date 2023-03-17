// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRoom } from "libraries/LibRoom.sol";

uint256 constant ID = uint256(keccak256("system._Room.Create"));

// _RoomCreateSystem creates a mining node as specified and returns the entity id
contract _RoomCreateSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (string memory name, uint256 location, uint256[] memory exits) = abi.decode(
      arguments,
      (string, uint256, uint256[])
    );

    require(LibRoom.get(components, location) == 0, "Room: exists at location");

    return abi.encode(LibRoom.create(world, components, name, location, exits));
  }

  function executeTyped(
    string memory name,
    uint256 location,
    uint256[] memory exits
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(name, location, exits));
  }
}
