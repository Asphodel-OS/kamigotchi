// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { LibData } from "libraries/LibData.sol";

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
    AffinityComponent(getAddressById(components, AffCompID)).remove(id);
    DescriptionComponent(getAddressById(components, DescCompID)).remove(id);
    NameComponent(getAddressById(components, NameCompID)).remove(id);
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

  function isHarvestingType(IUintComp components, uint256 id) internal view returns (bool) {
    return LibString.eq(getType(components, id), "HARVEST");
  }

  /////////////////
  // GETTERS

  // optional field for specific types of nodes, namely Harvesting Types
  function getAffinity(IUintComp components, uint256 id) internal view returns (string memory) {
    AffinityComponent comp = AffinityComponent(getAddressById(components, AffCompID));
    return comp.has(id) ? comp.get(id) : "";
  }

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexNodeComponent(getAddressById(components, IndexNodeCompID)).get(id);
  }

  function getRoom(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexRoomComponent(getAddressById(components, RoomCompID)).get(id);
  }

  // The type of node (e.g. Harvesting | Healing | etc)
  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).get(id);
  }

  /////////////////
  // QUERIES

  // Return the ID of a Node by its index
  function getByIndex(IUintComp components, uint32 index) internal view returns (uint256 result) {
    uint256 id = genID(index);
    return IsNodeComponent(getAddressById(components, IsNodeCompID)).has(id) ? id : 0;
  }

  /////////////////////
  // UTILS

  function genID(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("node", index)));
  }
}
