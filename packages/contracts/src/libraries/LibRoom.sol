// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IsRoomComponent, ID as IsRoomCompID } from "components/IsRoomComponent.sol";
import { DescriptionComponent, ID as DescCompID } from "components/DescriptionComponent.sol";
import { ExitsComponent, ID as ExitsCompID } from "components/ExitsComponent.sol";
import { LocationComponent, ID as LocationCompID } from "components/LocationComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";

library LibRoom {
  // Create a room at a given location.
  function create(
    IWorld world,
    IUintComp components,
    uint256 location,
    string memory name,
    string memory description,
    uint256[] memory exits
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsRoomComponent(getAddressById(components, IsRoomCompID)).set(id);
    LocationComponent(getAddressById(components, LocationCompID)).set(id, location);
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
    DescriptionComponent(getAddressById(components, DescCompID)).set(id, description);
    ExitsComponent(getAddressById(components, ExitsCompID)).set(id, exits);
    return id;
  }

  /////////////////
  // CHECKERS

  // Checks whether a path 'from' a location 'to' a location is a valid one
  function isValidPath(
    IUintComp components,
    uint256 from,
    uint256 to
  ) internal view returns (bool can) {
    uint256 fromRoomID = get(components, from);
    uint256[] memory exits = getExits(components, fromRoomID);

    for (uint256 i; i < exits.length; i++) {
      if (exits[i] == to) {
        can = true;
      }
    }
  }

  /////////////////
  // GETTERS

  // Get all the possible exits of a given room.
  function getExits(IUintComp components, uint256 id) internal view returns (uint256[] memory) {
    return ExitsComponent(getAddressById(components, ExitsCompID)).getValue(id);
  }

  function getLocation(IUintComp components, uint256 id) internal view returns (uint256) {
    return LocationComponent(getAddressById(components, LocationCompID)).getValue(id);
  }

  /////////////////
  // SETTERS

  function setDescription(IUintComp components, uint256 id, string memory description) internal {
    DescriptionComponent(getAddressById(components, DescCompID)).set(id, description);
  }

  function setExits(IUintComp components, uint256 id, uint256[] memory exits) internal {
    ExitsComponent(getAddressById(components, ExitsCompID)).set(id, exits);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
  }

  /////////////////
  // QUERIES

  // Retrieve the ID of a room with the given location.
  function get(IUintComp components, uint256 location) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRoomCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, LocationCompID),
      abi.encode(location)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length > 0) {
      result = results[0];
    }
  }
}
