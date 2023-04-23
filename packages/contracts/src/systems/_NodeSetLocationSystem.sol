// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibNode } from "libraries/LibNode.sol";

uint256 constant ID = uint256(keccak256("system._Node.Set.Location"));

// _NodeSetLocationSystem sets the location of a Node, identified by its name
contract _NodeSetLocationSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (string memory name, uint256 location) = abi.decode(arguments, (string, uint256));
    uint256 id = LibNode.getByName(components, name);

    require(id != 0, "Node: does not exist");

    LibNode.setLocation(components, id, location);
    return "";
  }

  function executeTyped(
    string memory name,
    uint256 location
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(name, location));
  }
}
