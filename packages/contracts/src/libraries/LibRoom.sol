// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { Coord, CoordLib } from "components/types/Coord.sol";

import { IDRoomComponent, ID as IDRoomCompID } from "components/IDRoomComponent.sol";
import { IDPointerComponent, ID as IDPointerCompID } from "components/IDPointerComponent.sol";
import { IndexRoomComponent, ID as IndexRoomCompID } from "components/IndexRoomComponent.sol";
import { IsRoomComponent, ID as IsRoomCompID } from "components/IsRoomComponent.sol";
import { DescriptionComponent, ID as DescCompID } from "components/DescriptionComponent.sol";
import { ExitsComponent, ID as ExitsCompID } from "components/ExitsComponent.sol";
import { LocationComponent, ID as LocationCompID } from "components/LocationComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";

import { LibArray } from "libraries/utils/LibArray.sol";
import { LibComp } from "libraries/utils/LibComp.sol";
import { Condition, LibConditional } from "libraries/LibConditional.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibData } from "libraries/LibData.sol";

library LibRoom {
  /////////////////
  // ENTITIES

  /// @notice Create a room at a given location.
  function create(
    IUintComp components,
    Coord memory location,
    uint32 index,
    string memory name,
    string memory description
  ) internal returns (uint256 id) {
    id = genID(index);
    IsRoomComponent(getAddressById(components, IsRoomCompID)).set(id); // TODO: change to EntityType
    IndexRoomComponent(getAddressById(components, IndexRoomCompID)).set(id, index);
    LocationComponent(getAddressById(components, LocationCompID)).set(id, location);
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
    DescriptionComponent(getAddressById(components, DescCompID)).set(id, description);
  }

  /// @notice creates a room gating condition
  function createGate(
    IWorld world,
    IUintComp components,
    uint32 roomIndex,
    uint32 sourceIndex, // optional: if condition specific from Room A->B
    uint32 condIndex,
    uint256 condValue,
    string memory type_,
    string memory logicType
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    LibConditional.create(components, id, Condition(type_, logicType, condIndex, condValue));

    IDRoomComponent(getAddressById(components, IDRoomCompID)).set(id, genGateAtPtr(roomIndex));
    IDPointerComponent sourceComp = IDPointerComponent(getAddressById(components, IDPointerCompID));
    if (sourceIndex != 0) sourceComp.set(id, genGateSourcePtr(sourceIndex));
    else sourceComp.set(id, 0);
  }

  function remove(IUintComp components, uint256 id) internal returns (uint256) {
    IsRoomComponent(getAddressById(components, IsRoomCompID)).remove(id);
    IndexRoomComponent(getAddressById(components, IndexRoomCompID)).remove(id);
    LocationComponent(getAddressById(components, LocationCompID)).remove(id);
    NameComponent(getAddressById(components, NameCompID)).remove(id);
    DescriptionComponent(getAddressById(components, DescCompID)).remove(id);
    ExitsComponent exitComp = ExitsComponent(getAddressById(components, ExitsCompID));
    if (exitComp.has(id)) exitComp.remove(id);
    return id;
  }

  function removeGate(IUintComp components, uint256 id) internal {
    IDRoomComponent(getAddressById(components, IDRoomCompID)).remove(id);
    IDPointerComponent(getAddressById(components, IDPointerCompID)).remove(id);
    LibConditional.remove(components, id);
  }

  /////////////////
  // CHECKERS

  function isRoom(IUintComp components, uint256 id) internal view returns (bool) {
    return IsRoomComponent(getAddressById(components, IsRoomCompID)).has(id);
  }

  /// @notice Checks whether a path from Room A to Room B is valid
  /// @dev does not include requirement checks
  function isReachable(
    IUintComp components,
    uint256 toIndex,
    uint256 fromID,
    uint256 toID
  ) internal view returns (bool) {
    LocationComponent locationComp = LocationComponent(getAddressById(components, LocationCompID));
    Coord memory fromLoc = locationComp.get(fromID);
    Coord memory toLoc = locationComp.get(toID);
    if (isAdjacent(fromLoc, toLoc)) return true;

    uint32[] memory exits = getSpecialExits(components, fromID);
    for (uint256 i; i < exits.length; i++) if (exits[i] == toIndex) return true;

    return false;
  }

  /// @notice checks if accessability conditions to a room are met
  function isAccessible(
    IUintComp components,
    uint32 fromIndex,
    uint32 toIndex,
    uint256 accID
  ) internal view returns (bool) {
    uint256[] memory conditions = queryGates(components, fromIndex, toIndex);

    if (conditions.length == 0) return true;
    return LibConditional.checkConditions(components, conditions, accID);
  }

  /// @notice checks if two locations are adjacent, XY axis only
  function isAdjacent(Coord memory a, Coord memory b) internal pure returns (bool) {
    if (a.z == b.z) {
      if (a.x == b.x) return a.y == b.y + 1 || a.y == b.y - 1;
      if (a.y == b.y) return a.x == b.x + 1 || a.x == b.x - 1;
    }

    return false;
  }

  /// @notice Checks if two entities share a room
  function sharesRoom(IUintComp components, uint256 aID, uint256 bID) internal view returns (bool) {
    (uint32 roomA, uint32 roomB) = LibComp.safeGetTwoUint32(
      getComponentById(components, IndexRoomCompID),
      aID,
      bID
    );
    return roomA == roomB;
  }

  /////////////////
  // GETTERS

  /// @notice Get all the possible exits of a given room.
  /// @dev rooms can exit to adjacent rooms by default; this is for special exits (ie portals from A->B)
  function getSpecialExits(
    IUintComp components,
    uint256 id
  ) internal view returns (uint32[] memory) {
    ExitsComponent comp = ExitsComponent(getAddressById(components, ExitsCompID));
    return comp.has(id) ? comp.get(id) : new uint32[](0);
  }

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexRoomComponent(getAddressById(components, IndexRoomCompID)).get(id);
  }

  function getLocation(IUintComp components, uint256 id) internal view returns (Coord memory) {
    return LocationComponent(getAddressById(components, LocationCompID)).get(id);
  }

  /////////////////
  // SETTERS

  function setDescription(IUintComp components, uint256 id, string memory description) internal {
    DescriptionComponent(getAddressById(components, DescCompID)).set(id, description);
  }

  function setExits(IUintComp components, uint256 id, uint32[] memory exits) internal {
    ExitsComponent(getAddressById(components, ExitsCompID)).set(id, exits);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
  }

  /////////////////
  // QUERIES

  function getByIndex(IUintComp components, uint32 index) internal view returns (uint256 result) {
    uint256 id = genID(index);
    return isRoom(components, id) ? id : 0;
  }

  function queryByLocation(
    IUintComp components,
    Coord memory loc
  ) internal view returns (uint256 result) {
    uint256[] memory results = LibQuery.getIsWithValue(
      components,
      LocationCompID,
      IsRoomCompID,
      abi.encode(loc)
    );
    return results.length > 0 ? results[0] : 0;
  }

  /// @notice queries for all gates from A->B, specific and non-specific (generic)
  function queryGates(
    IUintComp components,
    uint32 fromIndex,
    uint32 toIndex
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IDRoomCompID),
      abi.encode(genGateAtPtr(toIndex))
    );
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IDPointerCompID),
      abi.encode(0)
    );

    uint256[] memory generic = LibQuery.query(fragments);

    fragments[1].value = abi.encode(genGateSourcePtr(fromIndex));
    uint256[] memory specific = LibQuery.query(fragments);

    return LibArray.concat(generic, specific);
  }

  /// @notice queries for all gates related to a room
  /// @dev used for deleting rooms; nukes all gates coming to/from a room
  function queryAllGates(
    IUintComp components,
    uint32 toIndex
  ) internal view returns (uint256[] memory) {
    uint256[] memory gatesTo = IDRoomComponent(getAddressById(components, IDRoomCompID))
      .getEntitiesWithValue(genGateAtPtr(toIndex));
    uint256[] memory gatesFrom = IDPointerComponent(getAddressById(components, IDPointerCompID))
      .getEntitiesWithValue(genGateSourcePtr(toIndex));
    return LibArray.concat(gatesTo, gatesFrom);
  }

  //////////////////////
  // LOGGING

  function logMove(IUintComp components, uint256 holderID) internal {
    LibData.inc(components, holderID, 0, "MOVE", 1);
  }

  //////////////////////
  // UTILS

  function genID(uint32 roomIndex) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("room", roomIndex)));
  }

  // generates a pointer from a gate to destination room
  // eg. Moves to room 1; genGateAtPointer(1) is used to point to the room
  function genGateAtPtr(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("room.gate.to", index)));
  }

  // generates a pointer from a gate to source room
  // eg. Moves room 1 -> room 2; genGateSourcePointer(1) is used to point to the room
  function genGateSourcePtr(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("room.gate.from", index)));
  }
}
