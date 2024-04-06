// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { LibDataEntity } from "libraries/LibDataEntity.sol";

import { IsNodeComponent, ID as IsNodeCompID } from "components/IsNodeComponent.sol";
import { IndexNodeComponent, ID as IndexNodeCompID } from "components/IndexNodeComponent.sol";
import { AffinityComponent, ID as AffCompID } from "components/AffinityComponent.sol";
import { DescriptionComponent, ID as DescCompID } from "components/DescriptionComponent.sol";
import { IndexRoomComponent, ID as RoomCompID } from "components/IndexRoomComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

/*
 * LibNode handles all retrieval and manipulation of mining nodes/productions
 */
library LibNode {
  //////////////
  // INTERACTIONS

  // Create a Node as specified and return its id.
  // Type: [ HARVEST | HEALING | SACRIFICIAL | TRAINING ]
  function create(
    IUintComp components,
    uint32 index,
    string memory nodeType,
    uint32 roomIndex
  ) internal returns (uint256) {
    uint256 id = genID(index);
    IsNodeComponent(getAddressById(components, IsNodeCompID)).set(id);
    IndexNodeComponent(getAddressById(components, IndexNodeCompID)).set(id, index);
    TypeComponent(getAddressById(components, TypeCompID)).set(id, nodeType);
    IndexRoomComponent(getAddressById(components, RoomCompID)).set(id, roomIndex);
    return id;
  }

  function remove(IUintComp components, uint256 id) internal returns (uint256) {
    IsNodeComponent(getAddressById(components, IsNodeCompID)).remove(id);
    IndexNodeComponent(getAddressById(components, IndexNodeCompID)).remove(id);
    TypeComponent(getAddressById(components, TypeCompID)).remove(id);
    IndexRoomComponent(getAddressById(components, RoomCompID)).remove(id);
    if (hasAffinity(components, id))
      AffinityComponent(getAddressById(components, AffCompID)).remove(id);
    if (hasDescription(components, id))
      DescriptionComponent(getAddressById(components, DescCompID)).remove(id);
    if (hasName(components, id)) NameComponent(getAddressById(components, NameCompID)).remove(id);
    return id;
  }

  //////////////
  // SETTERS

  function setAffinity(IUintComp components, uint256 id, string memory affinity) internal {
    AffinityComponent(getAddressById(components, AffCompID)).set(id, affinity);
  }

  function setDescription(IUintComp components, uint256 id, string memory description) internal {
    DescriptionComponent(getAddressById(components, DescCompID)).set(id, description);
  }

  function setRoomIndex(IUintComp components, uint256 id, uint32 roomIndex) internal {
    IndexRoomComponent(getAddressById(components, RoomCompID)).set(id, roomIndex);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
  }

  //////////////
  // CHECKERS

  function hasAffinity(IUintComp components, uint256 id) internal view returns (bool) {
    return AffinityComponent(getAddressById(components, AffCompID)).has(id);
  }

  function hasDescription(IUintComp components, uint256 id) internal view returns (bool) {
    return DescriptionComponent(getAddressById(components, DescCompID)).has(id);
  }

  function hasName(IUintComp components, uint256 id) internal view returns (bool) {
    return NameComponent(getAddressById(components, NameCompID)).has(id);
  }

  function isHarvestingType(IUintComp components, uint256 id) internal view returns (bool) {
    return LibString.eq(getType(components, id), "HARVEST");
  }

  /////////////////
  // GETTERS

  // optional field for specific types of nodes, namely Harvesting Types
  function getAffinity(
    IUintComp components,
    uint256 id
  ) internal view returns (string memory affinity) {
    if (hasAffinity(components, id)) {
      affinity = AffinityComponent(getAddressById(components, AffCompID)).getValue(id);
    }
  }

  function getDescription(
    IUintComp components,
    uint256 id
  ) internal view returns (string memory description) {
    if (hasDescription(components, id)) {
      description = DescriptionComponent(getAddressById(components, DescCompID)).getValue(id);
    }
  }

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexNodeComponent(getAddressById(components, IndexNodeCompID)).getValue(id);
  }

  function getRoom(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexRoomComponent(getAddressById(components, RoomCompID)).getValue(id);
  }

  function getName(IUintComp components, uint256 id) internal view returns (string memory name) {
    if (hasName(components, id)) {
      name = NameComponent(getAddressById(components, NameCompID)).getValue(id);
    }
  }

  // The type of node (e.g. Harvesting | Healing | etc)
  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).getValue(id);
  }

  /////////////////
  // QUERIES

  // Return the ID of a Node by its index
  function getByIndex(IUintComp components, uint32 index) internal view returns (uint256 result) {
    uint256 id = genID(index);
    return IsNodeComponent(getAddressById(components, IsNodeCompID)).has(id) ? id : 0;
  }

  /////////////////////
  // LOGGING

  function logHarvestAt(
    IUintComp components,
    uint256 holderID,
    uint32 index,
    uint256 amt
  ) internal {
    LibDataEntity.inc(components, holderID, index, "HARVEST_AT_NODE", amt);
  }

  function logHarvestAffinity(
    IUintComp components,
    uint256 holderID,
    string memory affinity,
    uint256 amt
  ) internal {
    LibDataEntity.inc(
      components,
      holderID,
      0,
      LibString.concat("HARVEST_AFFINITY_", affinity),
      amt
    );
  }

  /////////////////////
  // UTILS

  function genID(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("Node", index)));
  }
}
