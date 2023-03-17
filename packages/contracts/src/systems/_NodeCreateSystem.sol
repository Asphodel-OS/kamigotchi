// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibNode } from "libraries/LibNode.sol";

uint256 constant ID = uint256(keccak256("system._Node.Create"));

// _NodeCreateSystem creates a mining node as specified and returns the entity id
contract _NodeCreateSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (string memory name, uint256 location) = abi.decode(arguments, (string, uint256));
    return abi.encode(LibNode.create(world, components, name, location));
  }

  function executeTyped(
    string memory name,
    uint256 location
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(name, location));
  }
}
