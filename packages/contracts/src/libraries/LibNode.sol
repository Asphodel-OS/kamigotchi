// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IsNodeComponent, ID as IsNodeCompID } from "components/IsNodeComponent.sol";
import { LocationComponent, ID as LocCompID } from "components/LocationComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";

/*
 * LibNode handles all retrieval and manipulation of mining nodes/productions
 */
library LibNode {
  // create creates a resource node as specified and returns the id
  function create(
    IWorld world,
    IUintComp components,
    string memory name,
    uint256 location
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsNodeComponent(getAddressById(components, IsNodeCompID)).set(id);
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
    LocationComponent(getAddressById(components, LocCompID)).set(id, location);
    return id;
  }

  /////////////////
  // GETTERS

  function getLocation(IUintComp components, uint256 id) internal view returns (uint256) {
    return LocationComponent(getAddressById(components, LocCompID)).getValue(id);
  }

  /////////////////
  // QUERIES

  // return an array of all nodes at a room location
  function getAllAtLocation(
    IUintComp components,
    uint256 location
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsNodeCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, LocCompID),
      abi.encode(location)
    );

    return LibQuery.query(fragments);
  }
}
