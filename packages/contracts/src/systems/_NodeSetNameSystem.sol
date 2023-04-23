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
    (string memory oldName, string memory newName) = abi.decode(arguments, (string, string));
    uint256 id = LibNode.getByName(components, oldName);

    require(id != 0, "Node: does not exist");
    require(LibNode.getByName(components, newName) == 0, "Node: naming conflict");

    LibNode.setName(components, id, newName);
    return "";
  }

  function executeTyped(
    string memory oldName,
    string memory newName
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(oldName, newName));
  }
}
