// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibNode } from "libraries/LibNode.sol";
import { Condition } from "libraries/LibConditional.sol";

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

  function addRequirement(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 nodeIndex,
      string memory for_,
      string memory type_,
      string memory logicType,
      uint32 index,
      uint256 value
    ) = abi.decode(arguments, (uint32, string, string, string, uint32, uint256));

    uint256 nodeID = LibNode.getByIndex(components, nodeIndex);
    require(nodeID != 0, "Node does not exist");
    require(!LibString.eq(type_, ""), "Requirement type cannot be empty");

    return
      LibNode.createReq(
        world,
        components,
        nodeIndex,
        for_,
        Condition(type_, logicType, index, value)
      );
  }

  function remove(uint32 index) public onlyOwner {
    uint256 id = LibNode.getByIndex(components, index);
    require(id != 0, "Node: does not exist");

    uint256[] memory requirements = LibNode.getReqs(components, index);
    for (uint256 i; i < requirements.length; i++) LibNode.unsetReq(components, requirements[i]);

    LibNode.remove(components, id);
  }

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    require(false, "not implemented");
  }
}
