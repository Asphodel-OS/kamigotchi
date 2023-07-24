// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRoom } from "libraries/LibRoom.sol";

uint256 constant ID = uint256(keccak256("system._Room.Set.Description"));

// update the description of an existing room, identified by its location
contract _RoomSetDescriptionSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint256 location, string memory description) = abi.decode(arguments, (uint256, string));

    uint256 id = LibRoom.get(components, location);
    require(id != 0, "Room: does not exist");

    LibRoom.setDescription(components, id, description);

    return "";
  }

  function executeTyped(
    uint256 location,
    string memory description
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(location, description));
  }
}
