// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { Condition } from "libraries/LibConditional.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibScavenge } from "libraries/LibScavenge.sol";
import { LibAllo } from "libraries/LibAllo.sol";

uint256 constant ID = uint256(keccak256("system.node.registry"));

// create a Node as specified
contract _NodeRegistrySystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function create(bytes memory arguments) public onlyAdmin(components) returns (uint256 id) {
    (
      uint32 index,
      string memory nodeType,
      uint32 item,
      uint32 room,
      string memory name,
      string memory description,
      string memory affinity
    ) = abi.decode(arguments, (uint32, string, uint32, uint32, string, string, string));
    id = LibNode.getByIndex(components, index);
    require(id == 0, "Node: already exists");

    id = LibNode.create(
      components,
      LibNode.Base(index, nodeType, item, room, name, description, affinity)
    );
  }

  // removes the entire node and all associated entities
  function remove(uint32 index) public onlyAdmin(components) {
    LibNode.remove(components, index);
  }

  //////////////////
  // REQUIREMENTS

  function addRequirement(bytes memory arguments) public onlyAdmin(components) returns (uint256) {
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

  ////////////////////
  // SCAVENGES

  function addScavenge(
    uint32 nodeIndex,
    uint256 tierCost
  ) public onlyAdmin(components) returns (uint256) {
    uint256 nodeID = LibNode.getByIndex(components, nodeIndex);
    require(nodeID != 0, "Node: does not exist");

    string memory affinity = LibNode.getAffinity(components, nodeID);
    return LibScavenge.create(components, LibScavenge.Base("NODE", nodeIndex, affinity), tierCost);
  }

  function addScavRewardBasic(
    bytes memory arguments
  ) public onlyAdmin(components) returns (uint256) {
    (uint32 nodeIndex, string memory rwdType, uint32 rwdIndex, uint256 value) = abi.decode(
      arguments,
      (uint32, string, uint32, uint256)
    );
    require(LibNode.getByIndex(components, nodeIndex) != 0, "Node: does not exist");

    uint256 scavID = LibNode.getScavBar(components, nodeIndex);
    require(scavID != 0, "Node: scav bar does not exist");

    uint256 anchorID = LibScavenge.genAlloAnchor(scavID);
    return LibAllo.createBasic(components, scavID, anchorID, rwdType, rwdIndex, value);
  }

  function addScavRewardDT(bytes memory arguments) public onlyAdmin(components) returns (uint256) {
    (uint32 nodeIndex, uint32[] memory keys, uint256[] memory weights, uint256 value) = abi.decode(
      arguments,
      (uint32, uint32[], uint256[], uint256)
    );
    require(LibNode.getByIndex(components, nodeIndex) != 0, "Node: does not exist");

    uint256 scavID = LibNode.getScavBar(components, nodeIndex);
    require(scavID != 0, "Node: scav bar does not exist");

    uint256 anchorID = LibScavenge.genAlloAnchor(scavID);
    return LibAllo.createDT(components, scavID, anchorID, keys, weights, value);
  }

  // // NOTE(jb): unused atm. commented out to meet gas limits on the freelane
  // function addScavRewardStat(
  //   bytes memory arguments
  // ) public onlyAdmin(components) returns (uint256) {
  //   (
  //     uint32 nodeIndex,
  //     string memory statType,
  //     int32 base,
  //     int32 shift,
  //     int32 boost,
  //     int32 sync
  //   ) = abi.decode(arguments, (uint32, string, int32, int32, int32, int32));
  //   require(LibNode.getByIndex(components, nodeIndex) != 0, "Node: does not exist");

  //   uint256 scavID = LibNode.getScavBar(components, nodeIndex);
  //   require(scavID != 0, "Node: scav bar does not exist");

  //   uint256 anchorID = LibScavenge.genAlloAnchor(scavID);
  //   return LibAllo.createStat(components, anchorID, statType, base, shift, boost, sync);
  // }

  // removes the scavenge bar associated with a node
  function removeScavenge(uint32 index) public onlyAdmin(components) {
    require(LibNode.getByIndex(components, index) != 0, "Node: does not exist");

    uint256 scavID = LibNode.getScavBar(components, index);
    require(scavID != 0, "Node: no scavenge bar");

    LibScavenge.remove(components, scavID);
  }

  function execute(bytes memory arguments) public onlyAdmin(components) returns (bytes memory) {
    require(false, "not implemented");
  }
}
