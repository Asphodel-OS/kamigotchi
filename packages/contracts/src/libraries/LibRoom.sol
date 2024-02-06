// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IndexRoomComponent, ID as IndexRoomCompID } from "components/IndexRoomComponent.sol";
import { DescriptionComponent, ID as DescCompID } from "components/DescriptionComponent.sol";
import { ExitsComponent, ID as ExitsCompID } from "components/ExitsComponent.sol";
import { LocationComponent, ID as LocationCompID } from "components/LocationComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";

import { LibConfig } from "libraries/LibConfig.sol";

struct Location {
  int32 x;
  int32 y;
  int32 z;
}

library LibRoom {
  // Create a room at a given location.
  function create(
    IWorld world,
    IUintComp components,
    Location memory location,
    uint256 index,
    string memory name,
    string memory description,
    Location[] memory exits
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IndexRoomComponent(getAddressById(components, IndexRoomCompID)).set(id, index);
    LocationComponent(getAddressById(components, LocationCompID)).set(id, location);
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
    DescriptionComponent(getAddressById(components, DescCompID)).set(id, description);
    ExitsComponent(getAddressById(components, ExitsCompID)).set(id, exits);
    return id;
  }

  // Remove a room at a given location.
  function remove(IUintComp components, uint256 id) internal returns (uint256) {
    IndexRoomComponent(getAddressById(components, IndexRoomCompID)).remove(id);
    LocationComponent(getAddressById(components, LocationCompID)).remove(id);
    NameComponent(getAddressById(components, NameCompID)).remove(id);
    DescriptionComponent(getAddressById(components, DescCompID)).remove(id);
    ExitsComponent(getAddressById(components, ExitsCompID)).remove(id);
    return id;
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
    uint256 fromID,
    Location memory fromLoc,
    Location memory toLoc
  ) internal view returns (bool) {
    if (_isAdjacent(fromLoc, toLoc)) return true;

    Location[] memory exits = getSpecialExits(components, fromID);
    for (uint256 i; i < exits.length; i++) {
      bytes32 toLocHash = keccak256(abi.encode(toLoc));
      if (keccak256(abi.encode(exits[i])) == toLocHash) return true;
    }
  }

  /// @notice checks if two locations are adjacent, XY axis only
  function _isAdjacent(Location memory a, Location memory b) internal pure returns (bool) {
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
  ) internal view returns (Location[] memory) {
    return ExitsComponent(getAddressById(components, ExitsCompID)).getValue(id);
  }

  function getLocation(IUintComp components, uint256 id) internal view returns (Location memory) {
    return LocationComponent(getAddressById(components, LocationCompID)).getValue(id);
  }

  function getDefaultStartLoc(IUintComp components) internal view returns (Location memory) {
    uint256 startUint = LibConfig.getValueOf(components, "ACCOUNT_START_LOC");
  }

  /////////////////
  // SETTERS

  function setDescription(IUintComp components, uint256 id, string memory description) internal {
    DescriptionComponent(getAddressById(components, DescCompID)).set(id, description);
  }

  function setExits(IUintComp components, uint256 id, Location[] memory exits) internal {
    ExitsComponent(getAddressById(components, ExitsCompID)).set(id, exits);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
  }

  /////////////////
  // QUERIES

  function getIndexByLoc(
    IUintComp components,
    Location memory location
  ) internal view returns (uint256 result) {
    IndexRoomComponent indexComp = IndexRoomComponent(getAddressById(components, IndexRoomCompID));

    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, indexComp, "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, LocationCompID),
      abi.encode(location)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length > 0) result = indexComp.getValue(results[0]);
  }

  function queryByLoc(
    IUintComp components,
    Location memory location
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IndexRoomCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, LocationCompID),
      abi.encode(location)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length > 0) result = results[0];
  }

  /// @notice batch queries 2 rooms by 2 locations to save gas
  function queryByLocPair(
    IUintComp components,
    Location memory fromLoc,
    Location memory toLoc
  ) internal view returns (uint256 fromID, uint256 toID) {
    LocationComponent locComp = LocationComponent(getAddressById(components, LocationCompID));
    IndexRoomComponent indexComp = IndexRoomComponent(getAddressById(components, IndexRoomCompID));

    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, indexComp, "");
    fragments[1] = QueryFragment(QueryType.HasValue, locComp, abi.encode(fromLoc));

    uint256[] memory results = LibQuery.query(fragments);
    require(results.length > 0, "LibRoom: no room at fromLoc");
    fromID = indexComp.getValue(results[0]);

    fragments[1] = QueryFragment(QueryType.HasValue, locComp, abi.encode(toLoc));
    results = LibQuery.query(fragments);
    require(results.length > 0, "LibRoom: no room at toLoc");
    toID = indexComp.getValue(results[0]);
  }

  //////////////////////
  // UTILS

  function locationToUint256(Location memory location) internal pure returns (uint256) {
    return
      (uint256(uint32(location.x)) << 64) |
      (uint256(uint32(location.y) << 32)) |
      uint256(uint32((location.z)));
  }

  function uint256ToLocation(uint256 value) internal pure returns (Location memory) {
    return
      Location(
        int32(uint32(value >> 64)),
        int32(uint32((value >> 32) & 0xFFFFFFFF)),
        int32(uint32(value & 0xFFFFFFFF))
      );
  }
}
