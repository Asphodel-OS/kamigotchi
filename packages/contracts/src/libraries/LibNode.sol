// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { IndexNodeComponent, ID as IndexNodeCompID } from "components/IndexNodeComponent.sol";
import { AffinityComponent, ID as AffCompID } from "components/AffinityComponent.sol";
import { DescriptionComponent, ID as DescCompID } from "components/DescriptionComponent.sol";
import { IndexRoomComponent, ID as RoomCompID } from "components/IndexRoomComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibFor } from "libraries/utils/LibFor.sol";

import { LibData } from "libraries/LibData.sol";
import { Condition, LibConditional } from "libraries/LibConditional.sol";
import { LibScavenge } from "libraries/LibScavenge.sol";

/*
 * LibNode handles all retrieval and manipulation of mining nodes/harvests
 */
library LibNode {
  //////////////
  // SHAPES

  // Create a Node as specified and return its id.
  // Type: [ HARVEST | HEALING | SACRIFICIAL | TRAINING ]
  function create(
    IUintComp components,
    uint32 index,
    string memory nodeType,
    uint32 roomIndex,
    string memory name,
    string memory description
  ) internal returns (uint256 id) {
    id = genID(index);
    LibEntityType.set(components, id, "NODE");
    IndexNodeComponent(getAddrByID(components, IndexNodeCompID)).set(id, index);
    TypeComponent(getAddrByID(components, TypeCompID)).set(id, nodeType);
    IndexRoomComponent(getAddrByID(components, RoomCompID)).set(id, roomIndex);
    NameComponent(getAddrByID(components, NameCompID)).set(id, name);
    DescriptionComponent(getAddrByID(components, DescCompID)).set(id, description);
  }

  /// @notice requirements for kamis to be put on a node
  /// @dev can use either kami or acc as target
  function addRequirement(
    IWorld world,
    IUintComp components,
    uint32 nodeIndex,
    Condition memory req
  ) internal returns (uint256 id) {
    id = LibConditional.createFor(world, components, req, genReqAnchor(nodeIndex));
  }

  function addScavBar(
    IUintComp components,
    uint32 nodeIndex,
    uint256 tierCost
  ) internal returns (uint256 id) {
    id = LibScavenge.create(components, "node", nodeIndex, tierCost);
  }

  function remove(IUintComp components, uint256 id, uint32 nodeIndex) internal {
    LibEntityType.remove(components, id);
    IndexNodeComponent(getAddrByID(components, IndexNodeCompID)).remove(id);
    TypeComponent(getAddrByID(components, TypeCompID)).remove(id);
    IndexRoomComponent(getAddrByID(components, RoomCompID)).remove(id);
    AffinityComponent(getAddrByID(components, AffCompID)).remove(id);
    DescriptionComponent(getAddrByID(components, DescCompID)).remove(id);
    NameComponent(getAddrByID(components, NameCompID)).remove(id);

    uint256[] memory reqs = getReqs(components, nodeIndex);
    for (uint256 i; i < reqs.length; i++) removeRequirement(components, reqs[i]);

    uint256 scavID = getScavBar(components, nodeIndex);
    if (scavID != 0) LibScavenge.remove(components, scavID);
  }

  function removeRequirement(IUintComp components, uint256 id) internal {
    LibConditional.remove(components, id);
    LibFor.remove(components, id);
  }

  ///////////////
  // INTERACTIONS

  function scavenge(
    IUintComp components,
    uint32 nodeIndex,
    uint256 amt,
    uint256 targetID
  ) internal {
    uint256 scavID = getScavBar(components, nodeIndex);
    if (scavID != 0) LibScavenge.incFor(components, "node", nodeIndex, amt, targetID);
  }

  //////////////
  // SETTERS

  function setAffinity(IUintComp components, uint256 id, string memory affinity) internal {
    AffinityComponent(getAddrByID(components, AffCompID)).set(id, affinity);
  }

  //////////////
  // CHECKERS

  function verifyRequirements(IUintComp components, uint32 nodeIndex, uint256 kamiID) public view {
    uint256[] memory reqIDs = getReqs(components, nodeIndex);
    if (!LibConditional.check(components, reqIDs, kamiID)) revert("node reqs not met");
  }

  function verifyRequirements(
    IUintComp components,
    uint32 nodeIndex,
    uint256[] memory kamiIDs
  ) public view {
    uint256[] memory reqIDs = getReqs(components, nodeIndex);
    for (uint256 i; i < kamiIDs.length; i++) {
      if (!LibConditional.check(components, reqIDs, kamiIDs[i])) revert("node reqs not met");
    }
  }

  function isHarvestingType(IUintComp components, uint256 id) internal view returns (bool) {
    return LibString.eq(getType(components, id), "HARVEST");
  }

  /////////////////
  // GETTERS

  // optional field for specific types of nodes, namely Harvesting Types
  function getAffinity(IUintComp components, uint256 id) internal view returns (string memory) {
    AffinityComponent comp = AffinityComponent(getAddrByID(components, AffCompID));
    return comp.has(id) ? comp.get(id) : "";
  }

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexNodeComponent(getAddrByID(components, IndexNodeCompID)).get(id);
  }

  function getRoom(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexRoomComponent(getAddrByID(components, RoomCompID)).get(id);
  }

  // The type of node (e.g. Harvesting | Healing | etc)
  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddrByID(components, TypeCompID)).get(id);
  }

  function getScavBar(IUintComp components, uint32 nodeIndex) internal view returns (uint256) {
    return LibScavenge.getRegistryID(components, "node", nodeIndex);
  }

  /////////////////
  // QUERIES

  // Return the ID of a Node by its index
  function getByIndex(IUintComp components, uint32 index) internal view returns (uint256 result) {
    uint256 id = genID(index);
    return LibEntityType.isShape(components, id, "NODE") ? id : 0;
  }

  function getReqs(IUintComp components, uint32 index) internal view returns (uint256[] memory) {
    return LibConditional.queryFor(components, genReqAnchor(index));
  }

  /////////////////////
  // UTILS

  function genID(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("node", index)));
  }

  function genReqAnchor(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("node.requirement", index)));
  }
}
