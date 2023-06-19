// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IsNodeComponent, ID as IsNodeCompID } from "components/IsNodeComponent.sol";
import { IndexNodeComponent, ID as IndexNodeCompID } from "components/IndexNodeComponent.sol";
import { AffinityComponent, ID as AffCompID } from "components/AffinityComponent.sol";
import { DescriptionComponent, ID as DescCompID } from "components/DescriptionComponent.sol";
import { LocationComponent, ID as LocCompID } from "components/LocationComponent.sol";
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
    IWorld world,
    IUintComp components,
    uint256 index,
    string memory nodeType,
    uint256 location
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsNodeComponent(getAddressById(components, IsNodeCompID)).set(id);
    IndexNodeComponent(getAddressById(components, IndexNodeCompID)).set(id, index);
    TypeComponent(getAddressById(components, TypeCompID)).set(id, nodeType);
    LocationComponent(getAddressById(components, LocCompID)).set(id, location);
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

  function setLocation(IUintComp components, uint256 id, uint256 location) internal {
    LocationComponent(getAddressById(components, LocCompID)).set(id, location);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
  }

  //////////////
  // CHECKERS

  function hasAffinity(IUintComp components, uint256 id) internal view returns (bool) {
    return AffinityComponent(getAddressById(components, AffCompID)).has(id);
  }

  function isHarvestingType(IUintComp components, uint256 id) internal view returns (bool) {
    return LibString.eq(getType(components, id), "HARVEST");
  }

  /////////////////
  // GETTERS

  // optional field for specific types of nodes, namely Harvesting Types
  function getAffinity(IUintComp components, uint256 id) internal view returns (string memory) {
    return AffinityComponent(getAddressById(components, AffCompID)).getValue(id);
  }

  function getLocation(IUintComp components, uint256 id) internal view returns (uint256) {
    return LocationComponent(getAddressById(components, LocCompID)).getValue(id);
  }

  // The type of node (e.g. Harvesting | Healing | etc)
  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).getValue(id);
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

  // Return the ID of a Node by its index
  function getByIndex(IUintComp components, uint256 index) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsNodeCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IndexNodeCompID),
      abi.encode(index)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) {
      result = results[0];
    }
  }

  // Return the ID of a Node by its name
  function getByName(
    IUintComp components,
    string memory name
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsNodeCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, NameCompID),
      abi.encode(name)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) {
      result = results[0];
    }
  }
}
