// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibNode } from "libraries/LibNode.sol";

uint256 constant ID = uint256(keccak256("system.node.registry"));

// create a Node as specified
contract _NodeRegistrySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function create(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 index,
      string memory nodeType,
      uint32 roomIndex,
      string memory name,
      string memory description,
      string memory affinity
    ) = abi.decode(arguments, (uint32, string, uint32, string, string, string));
    uint256 id = LibNode.getByIndex(components, index);

    require(id == 0, "Node: already exists");

    id = LibNode.create(components, index, nodeType, roomIndex);
    LibNode.setName(components, id, name);
    LibNode.setDescription(components, id, description);
    if (!LibString.eq(affinity, "")) {
      LibNode.setAffinity(components, id, affinity);
    }
    return id;
  }

  function remove(uint32 index) public onlyOwner {
    uint256 id = LibNode.getByIndex(components, index);
    require(id != 0, "Node: does not exist");

    LibNode.remove(components, id);
  }

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    require(false, "not implemented");
  }
}
