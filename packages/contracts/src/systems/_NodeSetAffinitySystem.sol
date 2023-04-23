// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibNode } from "libraries/LibNode.sol";

uint256 constant ID = uint256(keccak256("system._Node.Set.Affinity"));

// _NodeSetAffinitySystem sets the affinity of a Node, identified by its name
contract _NodeSetAffinitySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (string memory name, string memory affinity) = abi.decode(arguments, (string, string));
    uint256 id = LibNode.getByName(components, name);

    require(id != 0, "Node: does not exist");

    LibNode.setAffinity(components, id, affinity);
    return "";
  }

  function executeTyped(
    string memory name,
    string memory affinity
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(name, affinity));
  }
}
