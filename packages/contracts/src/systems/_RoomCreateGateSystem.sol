// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { Location, LibRoom } from "libraries/LibRoom.sol";

uint256 constant ID = uint256(keccak256("system._Room.Create.Gate"));

// create a room within the world
contract _RoomCreateGateSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint32 roomIndex,
      uint32 sourceIndex, // optional: if condition specific from Room A->B
      uint32 conditionIndex,
      uint256 conditionValue,
      string memory logicType,
      string memory type_
    ) = abi.decode(arguments, (uint32, uint32, uint32, uint256, string, string));

    require(LibRoom.queryByIndex(components, roomIndex) != 0, "Room: does not exist");
    require(
      sourceIndex == 0 || LibRoom.queryByIndex(components, sourceIndex) != 0,
      "Room: source does not exists"
    );

    return
      abi.encode(
        LibRoom.createGate(
          world,
          components,
          roomIndex,
          sourceIndex,
          conditionIndex,
          conditionValue,
          logicType,
          type_
        )
      );
  }

  function executeTyped(
    uint32 roomIndex,
    uint32 sourceIndex, // optional: if condition specific from Room A->B
    uint32 conditionIndex,
    uint256 conditionValue,
    string memory logicType,
    string memory type_
  ) public onlyOwner returns (bytes memory) {
    return
      execute(abi.encode(roomIndex, sourceIndex, conditionIndex, conditionValue, logicType, type_));
  }
}
