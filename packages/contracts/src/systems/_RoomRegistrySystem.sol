// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { Coord, LibRoom } from "libraries/LibRoom.sol";
import { Condition } from "libraries/LibConditional.sol";

uint256 constant ID = uint256(keccak256("system.room.registry"));

// create a room within the world
contract _RoomRegistrySystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function create(bytes memory arguments) public onlyAdmin(components) returns (uint256) {
    (
      int32 x,
      int32 y,
      int32 z,
      uint32 index,
      string memory name,
      string memory description,
      uint32[] memory exits
    ) = abi.decode(arguments, (int32, int32, int32, uint32, string, string, uint32[]));
    Coord memory location = Coord(x, y, z);

    require(LibRoom.queryByLocation(components, location) == 0, "Room: already exists at location");
    require(LibRoom.getByIndex(components, index) == 0, "Room: already exists at index");
    require(bytes(name).length > 0, "Room: name cannot be empty");

    uint256 id = LibRoom.create(components, location, index, name, description);
    if (exits.length > 0 && exits[0] != 0) LibRoom.setExits(components, id, exits);

    return id;
  }

  function addGate(bytes memory arguments) public onlyAdmin(components) returns (uint256) {
    (
      uint32 roomIndex,
      uint32 sourceIndex, // optional: if condition specific from Room A->B
      uint32 conditionIndex,
      uint256 conditionValue,
      string memory type_,
      string memory logicType,
      string memory condFor
    ) = abi.decode(arguments, (uint32, uint32, uint32, uint256, string, string, string));

    require(LibRoom.getByIndex(components, roomIndex) != 0, "Room: does not exist");
    require(
      sourceIndex == 0 || LibRoom.getByIndex(components, sourceIndex) != 0,
      "Room: source does not exists"
    );

    return
      LibRoom.createGate(
        world,
        components,
        roomIndex,
        sourceIndex,
        Condition(type_, logicType, conditionIndex, conditionValue, condFor)
      );
  }

  function addFlag(uint32 index, string memory flag) public onlyAdmin(components) {
    LibRoom.addFlag(components, index, flag);
  }

  function remove(uint32 index) public onlyAdmin(components) {
    uint256 roomID = LibRoom.getByIndex(components, index);
    require(roomID != 0, "Room: does not exist");

    LibRoom.remove(components, index);
  }

  function execute(bytes memory arguments) public onlyAdmin(components) returns (bytes memory) {
    require(false, "not implemented");
  }
}
