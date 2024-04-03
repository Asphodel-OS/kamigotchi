// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibNPC } from "libraries/LibNPC.sol";

uint256 constant ID = uint256(keccak256("system._NPC.Create"));

// create a NPC as specified
contract _NPCCreateSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint32 index, string memory name, uint32 roomIndex) = abi.decode(
      arguments,
      (uint32, string, uint32)
    );
    uint256 id = LibNPC.getByIndex(components, index);

    require(id == 0, "NPC: already exists");

    id = LibNPC.create(components, index, name, roomIndex);
    return abi.encode(id);
  }

  function executeTyped(
    uint32 index,
    string memory name,
    uint32 roomIndex
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, name, roomIndex));
  }
}
