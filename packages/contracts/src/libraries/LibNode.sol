// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { AffinityComponent, ID as AffCompID } from "components/AffinityComponent.sol";
import { DescriptionComponent, ID as DescCompID } from "components/DescriptionComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IndexNodeComponent, ID as IndexNodeCompID } from "components/IndexNodeComponent.sol";
import { IndexRoomComponent, ID as RoomCompID } from "components/IndexRoomComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";

import { LibBonus } from "libraries/LibBonus.sol";
import { LibData } from "libraries/LibData.sol";
import { Condition, LibConditional } from "libraries/LibConditional.sol";
import { LibScavenge } from "libraries/LibScavenge.sol";

/** @notice
 * Nodes are shapes that can be harvested on.
 *
 * Shape:
 *  - IndexNode
 *  - Type // only uses HARVEST for now
 *  - IndexItem: the item harvested
 *  - Room (equivalent to nodeIndex)
 *  - Name
 *  - Description
 *  - Affinity (optional)
 */
library LibNode {
  using LibString for string;

  struct Base {
    uint32 index;
    string type_;
    uint32 item;
    uint32 room; // todo: ditch room comp entirely? since nodeIndex = roomIndex
    string name;
    string description; // todo: remove, room index is used instead
    string affinity;
  }

  //////////////
  // SHAPES

  // Create a Node as specified and return its id.
  // Type: [ HARVEST | HEALING | SACRIFICIAL | TRAINING ]
  function create(IUintComp components, Base memory node) internal returns (uint256 id) {
    id = genID(node.index);
    LibEntityType.set(components, id, "NODE");

    IndexNodeComponent(getAddrByID(components, IndexNodeCompID)).set(id, node.index);
    TypeComponent(getAddrByID(components, TypeCompID)).set(id, node.type_);
    IndexItemComponent(getAddrByID(components, IndexItemCompID)).set(id, node.item);
    IndexRoomComponent(getAddrByID(components, RoomCompID)).set(id, node.room);
    NameComponent(getAddrByID(components, NameCompID)).set(id, node.name);
    DescriptionComponent(getAddrByID(components, DescCompID)).set(id, node.description);

    if (!node.affinity.eq(""))
      AffinityComponent(getAddrByID(components, AffCompID)).set(id, node.affinity.upper());
  }

  /// @notice add bonuses that kamis get when entering node
  /// @dev node bonuses have a fix end type (UPON_HARVEST_STOP)
  function addBonus(
    IUintComp components,
    uint32 nodeIndex,
    string memory bonusType,
    int256 value
  ) internal returns (uint256 id) {
    id = LibBonus.regCreate(
      components,
      genID(nodeIndex),
      genBonusAnchor(nodeIndex),
      bonusType,
      "UPON_HARVEST_STOP",
      0,
      value
    );
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

  function remove(IUintComp components, uint32 index) public {
    uint256 id = LibNode.getByIndex(components, index);
    require(id != 0, "Node: does not exist");

    LibEntityType.remove(components, id);
    IndexNodeComponent(getAddrByID(components, IndexNodeCompID)).remove(id);
    TypeComponent(getAddrByID(components, TypeCompID)).remove(id);
    IndexRoomComponent(getAddrByID(components, RoomCompID)).remove(id);
    AffinityComponent(getAddrByID(components, AffCompID)).remove(id);
    DescriptionComponent(getAddrByID(components, DescCompID)).remove(id);
    NameComponent(getAddrByID(components, NameCompID)).remove(id);

    LibBonus.regRemoveByAnchor(components, genBonusAnchor(index));

    uint256[] memory reqs = getReqs(components, index);
    LibConditional.remove(components, reqs);

    uint256 scavID = getScavBar(components, index);
    if (scavID != 0) LibScavenge.remove(components, scavID);
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
    if (scavID != 0) LibScavenge.incFor(components, "NODE", nodeIndex, amt, targetID);
  }

  function assignBonuses(IUintComp components, uint32 nodeIndex, uint256 kamiID) internal {
    LibBonus.assignTemporary(components, genBonusAnchor(nodeIndex), kamiID);
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
    return AffinityComponent(getAddrByID(components, AffCompID)).safeGet(id);
  }

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexNodeComponent(getAddrByID(components, IndexNodeCompID)).get(id);
  }

  function getItem(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexItemComponent(getAddrByID(components, IndexItemCompID)).get(id);
  }

  function getRoom(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexRoomComponent(getAddrByID(components, RoomCompID)).get(id);
  }

  // The type of node (e.g. Harvesting | Healing | etc)
  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddrByID(components, TypeCompID)).get(id);
  }

  function getScavBar(IUintComp components, uint32 nodeIndex) internal view returns (uint256) {
    return LibScavenge.getRegistryID(components, "NODE", nodeIndex);
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

  function genBonusAnchor(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("node.bonus", index)));
  }

  function genReqAnchor(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("node.requirement", index)));
  }
}
