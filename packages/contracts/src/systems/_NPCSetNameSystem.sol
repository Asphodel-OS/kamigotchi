// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibNPC } from "libraries/LibNPC.sol";

uint256 constant ID = uint256(keccak256("system._NPC.Set.Name"));

// set the Name of a NPC, identified by its NPC Index
contract _NPCSetNameSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint256 index, string memory name) = abi.decode(arguments, (uint256, string));
    uint256 id = LibNPC.getByIndex(components, index);

    require(id != 0, "NPC: does not exist");

    LibNPC.setName(components, id, name);
    return "";
  }

  function executeTyped(uint256 index, string memory name) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, name));
  }
}
