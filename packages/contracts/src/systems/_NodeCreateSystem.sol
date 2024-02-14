// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibNode } from "libraries/LibNode.sol";

uint256 constant ID = uint256(keccak256("system._Node.Create"));

// create a Node as specified
contract _NodeCreateSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
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

    id = LibNode.create(world, components, index, nodeType, roomIndex);
    LibNode.setName(components, id, name);
    LibNode.setDescription(components, id, description);
    if (!LibString.eq(affinity, "")) {
      LibNode.setAffinity(components, id, affinity);
    }
    return abi.encode(id);
  }

  function executeTyped(
    uint32 index,
    string memory nodeType,
    uint32 roomIndex,
    string memory name,
    string memory description,
    string memory affinity
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, nodeType, roomIndex, name, description, affinity));
  }
}
