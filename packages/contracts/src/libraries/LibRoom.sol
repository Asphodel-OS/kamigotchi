// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IndexRoomComponent, ID as IndexRoomCompID } from "components/IndexRoomComponent.sol";
import { IndexSourceComponent, ID as IndexSourceCompID } from "components/IndexSourceComponent.sol";
import { IsConditionComponent, ID as IsConditionCompID } from "components/IsConditionComponent.sol";
import { IsRoomComponent, ID as IsRoomCompID } from "components/IsRoomComponent.sol";
import { DescriptionComponent, ID as DescCompID } from "components/DescriptionComponent.sol";
import { ExitsComponent, ID as ExitsCompID } from "components/ExitsComponent.sol";
import { LocationComponent, ID as LocationCompID } from "components/LocationComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";

import { LibBoolean } from "libraries/LibBoolean.sol";
import { LibConfig } from "libraries/LibConfig.sol";

struct Location {
  int32 x;
  int32 y;
  int32 z;
}

library LibRoom {
  /////////////////
  // ENTITIES

  /// @notice Create a room at a given location.
  function create(
    IWorld world,
    IUintComp components,
    Location memory location,
    uint32 index,
    string memory name,
    string memory description
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsRoomComponent(getAddressById(components, IsRoomCompID)).set(id);
    IndexRoomComponent(getAddressById(components, IndexRoomCompID)).set(id, index);
    LocationComponent(getAddressById(components, LocationCompID)).set(id, location);
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
    DescriptionComponent(getAddressById(components, DescCompID)).set(id, description);
    return id;
  }

  /// @notice creates a room gating condition
  function createGate(
    IWorld world,
    IUintComp components,
    uint32 roomIndex,
    uint32 sourceIndex, // optional: if condition specific from Room A->B
    uint32 conIndex,
    uint256 conValue,
    string memory logicType,
    string memory type_
  ) internal returns (uint256 id) {
    id = LibBoolean.create(world, components, type_, logicType);
    IndexRoomComponent(getAddressById(components, IndexRoomCompID)).set(id, roomIndex);
    IndexSourceComponent(getAddressById(components, IndexSourceCompID)).set(id, sourceIndex);
    if (conIndex != 0) LibBoolean.setIndex(components, id, conIndex);
    if (conValue != 0) LibBoolean.setValue(components, id, conValue);
  }

  function remove(IUintComp components, uint256 id) internal returns (uint256) {
    IsRoomComponent(getAddressById(components, IsRoomCompID)).remove(id);
    IndexRoomComponent(getAddressById(components, IndexRoomCompID)).remove(id);
    LocationComponent(getAddressById(components, LocationCompID)).remove(id);
    NameComponent(getAddressById(components, NameCompID)).remove(id);
    DescriptionComponent(getAddressById(components, DescCompID)).remove(id);
    unsetExits(components, id);
    return id;
  }

  function removeGate(IUintComp components, uint256 id) internal {
    LibBoolean.remove(components, id);
    IndexRoomComponent(getAddressById(components, IndexRoomCompID)).remove(id);

    unsetSource(components, id);
    LibBoolean.unsetIndex(components, id);
    LibBoolean.unsetValue(components, id);
  }

  /////////////////
  // CHECKERS

  /// @notice Checks if two entities share a location
  function inSameLocation(IUintComp components, uint256 a, uint256 b) internal view returns (bool) {
    LocationComponent comp = LocationComponent(getAddressById(components, LocationCompID));
    return isSameLocation(comp.getValue(a), comp.getValue(b));
  }

  function isSameLocation(Location memory a, Location memory b) internal pure returns (bool) {
    return keccak256(abi.encode(a)) == keccak256(abi.encode(b));
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
    Location memory fromLoc = locationComp.getValue(fromID);
    Location memory toLoc = locationComp.getValue(toID);
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
    uint256 accountID
  ) internal view returns (bool) {
    uint256[] memory conditions = queryGates(components, fromIndex, toIndex);

    if (conditions.length == 0) return true;
    return LibBoolean.checkConditions(components, conditions, accountID);
  }

  /// @notice checks if two locations are adjacent, XY axis only
  function isAdjacent(Location memory a, Location memory b) internal pure returns (bool) {
    if (a.z == b.z) {
      if (a.x == b.x) return a.y == b.y + 1 || a.y == b.y - 1;
      if (a.y == b.y) return a.x == b.x + 1 || a.x == b.x - 1;
    }

    return false;
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
    return comp.has(id) ? comp.getValue(id) : new uint32[](0);
  }

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexRoomComponent(getAddressById(components, IndexRoomCompID)).getValue(id);
  }

  function getLocation(IUintComp components, uint256 id) internal view returns (Location memory) {
    return LocationComponent(getAddressById(components, LocationCompID)).getValue(id);
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

  function unsetExits(IUintComp components, uint256 id) internal {
    ExitsComponent comp = ExitsComponent(getAddressById(components, ExitsCompID));
    if (comp.has(id)) comp.remove(id);
  }

  function unsetSource(IUintComp components, uint256 id) internal {
    IndexSourceComponent comp = IndexSourceComponent(getAddressById(components, IndexSourceCompID));
    if (comp.has(id)) comp.remove(id);
  }

  /////////////////
  // QUERIES

  function queryByIndex(IUintComp components, uint32 index) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRoomCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexRoomCompID),
      abi.encode(index)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length > 0) result = results[0];
  }

  /// @notice a dual query for two rooms via index
  /// @dev clunky and not ideal, but used here to reduce query calls
  function queryByIndexDouble(
    IUintComp components,
    uint32 indexA,
    uint32 indexB
  ) internal view returns (uint256 roomAID, uint256 roomBID) {
    IndexRoomComponent indexComp = IndexRoomComponent(getAddressById(components, IndexRoomCompID));

    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRoomCompID), "");

    fragments[1] = QueryFragment(QueryType.HasValue, indexComp, abi.encode(indexA));
    uint256[] memory results = LibQuery.query(fragments);
    require(results.length > 0, "LibRoom: no room at index A");
    roomAID = results[0];

    fragments[1] = QueryFragment(QueryType.HasValue, indexComp, abi.encode(indexB));
    results = LibQuery.query(fragments);
    require(results.length > 0, "LibRoom: no room at index B");
    roomBID = results[0];
  }

  function queryByLocation(
    IUintComp components,
    Location memory loc
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRoomCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, LocationCompID),
      abi.encode(loc)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length > 0) result = results[0];
  }

  /// @notice queries for all gates from A->B, specific and non-specific (generic)
  function queryGates(
    IUintComp components,
    uint32 fromIndex,
    uint32 toIndex
  ) internal view returns (uint256[] memory) {
    IndexSourceComponent sourceComp = IndexSourceComponent(
      getAddressById(components, IndexSourceCompID)
    );

    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(
      QueryType.Has,
      getComponentById(components, IsConditionCompID),
      ""
    );
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexRoomCompID),
      abi.encode(toIndex)
    );
    fragments[2] = QueryFragment(QueryType.HasValue, sourceComp, abi.encode(0));
    uint256[] memory generic = LibQuery.query(fragments);

    fragments[2] = QueryFragment(QueryType.HasValue, sourceComp, abi.encode(fromIndex));
    uint256[] memory specific = LibQuery.query(fragments);

    uint256 genLen = generic.length;
    uint256 specLen = specific.length;
    uint256[] memory results = new uint256[](genLen + specLen);
    for (uint256 i; i < genLen; i++) results[i] = generic[i];
    for (uint256 i; i < specLen; i++) results[genLen + i] = specific[i];

    return results;
  }

  /// @notice queries for all gates for a room
  /// @dev used for deleting rooms
  function queryAllGates(
    IUintComp components,
    uint32 toIndex
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(
      QueryType.Has,
      getComponentById(components, IsConditionCompID),
      ""
    );
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexRoomCompID),
      abi.encode(toIndex)
    );
    return LibQuery.query(fragments);
  }

  //////////////////////
  // UTILS

  function locationToUint256(Location memory location) internal pure returns (uint256) {
    return
      (uint256(uint32(location.x)) << 128) |
      (uint256(uint32(location.y)) << 64) |
      uint256(uint32(location.z));
  }

  function uint256ToLocation(uint256 value) internal pure returns (Location memory) {
    return
      Location(
        int32(int((value >> 128))),
        int32(int((value >> 64) & 0xFFFFFFFFFFFFFFFF)),
        int32(int((value) & 0xFFFFFFFFFFFFFFFF))
      );
  }
}
