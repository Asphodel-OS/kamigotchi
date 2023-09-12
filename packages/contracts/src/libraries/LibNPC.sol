// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IsNPCComponent, ID as IsNPCCompID } from "components/IsNPCComponent.sol";
import { IndexNPCComponent, ID as IndexNPCCompID } from "components/IndexNPCComponent.sol";
import { LocationComponent, ID as LocationCompID } from "components/LocationComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { Strings } from "utils/Strings.sol";

/*
 * LibNPC handles all operations interacting with NPCs
 */
library LibNPC {
  // create a merchant entity as specified
  function create(
    IWorld world,
    IUintComp components,
    uint256 index,
    string memory name,
    uint256 location
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsNPCComponent(getAddressById(components, IsNPCCompID)).set(id);
    IndexNPCComponent(getAddressById(components, IndexNPCCompID)).set(id, index);
    setName(components, id, name);
    setLocation(components, id, location);
    return id;
  }

  /////////////////
  // CHECKERS

  // Check whether a user account shares a room with the specified merchant
  // Merchants with location 0 are considered global and are always accessible
  function sharesRoomWith(
    IUintComp components,
    uint256 id,
    uint256 accountID
  ) internal view returns (bool) {
    uint256 location = getLocation(components, id);
    return location == 0 || location == getLocation(components, accountID);
  }

  /////////////////
  // SETTERS

  function setLocation(IUintComp components, uint256 id, uint256 location) internal {
    LocationComponent(getAddressById(components, LocationCompID)).set(id, location);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
  }

  /////////////////
  // GETTERS

  function getIndex(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexNPCComponent(getAddressById(components, IndexNPCCompID)).getValue(id);
  }

  function getLocation(IUintComp components, uint256 id) internal view returns (uint256) {
    return LocationComponent(getAddressById(components, LocationCompID)).getValue(id);
  }

  // gets the name of a specified merchant
  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddressById(components, NameCompID)).getValue(id);
  }

  /////////////////
  // QUERIES

  // Return the ID of a Merchant by its index
  function getByIndex(IUintComp components, uint256 index) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsNPCCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexNPCCompID),
      abi.encode(index)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) {
      result = results[0];
    }
  }
}
