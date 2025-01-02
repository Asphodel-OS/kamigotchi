// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { Condition } from "libraries/LibConditional.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibScavenge } from "libraries/LibScavenge.sol";
import { LibAllo } from "libraries/LibAllo.sol";

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

    id = LibNode.create(components, index, nodeType, roomIndex, name, description);
    if (!LibString.eq(affinity, "")) {
      LibNode.setAffinity(components, id, affinity);
    }
    return id;
  }

  function addRequirement(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 nodeIndex,
      string memory type_,
      string memory logicType,
      uint32 index,
      uint256 value,
      string memory for_
    ) = abi.decode(arguments, (uint32, string, string, uint32, uint256, string));

    uint256 nodeID = LibNode.getByIndex(components, nodeIndex);
    require(nodeID != 0, "Node does not exist");
    require(!LibString.eq(type_, ""), "Requirement type cannot be empty");

    return
      LibNode.addRequirement(
        world,
        components,
        nodeIndex,
        Condition(type_, logicType, index, value, for_)
      );
  }

  function addScavBar(uint32 nodeIndex, uint256 tierCost) public onlyOwner {
    require(LibNode.getByIndex(components, nodeIndex) != 0, "Node: does not exist");
    LibScavenge.create(components, "node", nodeIndex, tierCost);
  }

  function addScavRewardBasic(bytes memory arguments) public onlyOwner returns (uint256) {
    (uint32 nodeIndex, string memory rwdType, uint32 rwdIndex, uint256 value) = abi.decode(
      arguments,
      (uint32, string, uint32, uint256)
    );
    require(LibNode.getByIndex(components, nodeIndex) != 0, "Node: does not exist");

    uint256 scavID = LibNode.getScavBar(components, nodeIndex);
    require(scavID != 0, "Node: scav bar does not exist");

    uint256 parentID = LibScavenge.genAlloAnchor(scavID);
    return LibAllo.createBasic(components, parentID, rwdType, rwdIndex, value);
  }

  function addScavRewardDT(bytes memory arguments) public onlyOwner returns (uint256) {
    (uint32 nodeIndex, uint32[] memory keys, uint256[] memory weights, uint256 value) = abi.decode(
      arguments,
      (uint32, uint32[], uint256[], uint256)
    );
    require(LibNode.getByIndex(components, nodeIndex) != 0, "Node: does not exist");

    uint256 scavID = LibNode.getScavBar(components, nodeIndex);
    require(scavID != 0, "Node: scav bar does not exist");

    uint256 parentID = LibScavenge.genAlloAnchor(scavID);
    return LibAllo.createDT(components, parentID, keys, weights, value);
  }

  function addScavRewardStat(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 nodeIndex,
      string memory statType,
      int32 base,
      int32 shift,
      int32 boost,
      int32 sync
    ) = abi.decode(arguments, (uint32, string, int32, int32, int32, int32));
    require(LibNode.getByIndex(components, nodeIndex) != 0, "Node: does not exist");

    uint256 scavID = LibNode.getScavBar(components, nodeIndex);
    require(scavID != 0, "Node: scav bar does not exist");

    uint256 parentID = LibScavenge.genAlloAnchor(scavID);
    return LibAllo.createStat(components, parentID, statType, base, shift, boost, sync);
  }

  function remove(uint32 index) public onlyOwner {
    uint256 id = LibNode.getByIndex(components, index);
    require(id != 0, "Node: does not exist");

    LibNode.remove(components, id, index);
  }

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    require(false, "not implemented");
  }
}
