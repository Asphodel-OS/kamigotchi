// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IComponents } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById, addressToEntity } from "solecs/utils.sol";

import { IdOwnerComponent, ID as IdOwnerCompID } from "components/IdOwnerComponent.sol";
import { IsOperatorComponent, ID as IsOperatorCompID } from "components/IsOperatorComponent.sol";
import { AddressPlayerComponent, ID as AddrPlayerCompID } from "components/AddressPlayerComponent.sol";
import { BlockLastComponent, ID as BlockLastCompID } from "components/BlockLastComponent.sol";
import { LocationComponent, ID as LocCompID } from "components/LocationComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { LibRoom } from "libraries/LibRoom.sol";

library LibOperator {
  /////////////////
  // INTERACTIONS

  // Create an account operator
  function create(
    IWorld world,
    IComponents components,
    address playerAddr,
    address ownerAddr
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsOperatorComponent(getAddressById(components, IsOperatorCompID)).set(id);
    IdOwnerComponent(getAddressById(components, IdOwnerCompID)).set(id, addressToEntity(ownerAddr));
    LocationComponent(getAddressById(components, LocCompID)).set(id, 1);
    AddressPlayerComponent(getAddressById(components, AddrPlayerCompID)).set(id, playerAddr);
    return id;
  }

  // Move the Operator to a room
  function move(
    IComponents components,
    uint256 id,
    uint256 to
  ) internal {
    LocationComponent(getAddressById(components, LocCompID)).set(id, to);
  }

  /////////////////
  // SETTERS

  function setAddress(
    IComponents components,
    uint256 id,
    address addr
  ) internal returns (uint256) {
    AddressPlayerComponent(getAddressById(components, AddrPlayerCompID)).set(id, addr);
    return id;
  }

  function setName(
    IComponents components,
    uint256 id,
    string memory name
  ) internal returns (uint256) {
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
    return id;
  }

  /////////////////
  // CHECKS

  // Check whether a character can move to a location from where they currently are.
  // This function assumes that the entity id provided belongs to a character.
  // NOTE(ja): This function can include any other checks we want moving forward.
  function canMoveTo(
    IComponents components,
    uint256 id,
    uint256 to
  ) internal view returns (bool) {
    uint256 from = getLocation(components, id);
    return LibRoom.isValidPath(components, from, to);
  }

  /////////////////
  // COMPONENT RETRIEVAL

  // get the address of an operator
  function getAddress(IComponents components, uint256 id) internal view returns (address) {
    return AddressPlayerComponent(getAddressById(components, AddrPlayerCompID)).getValue(id);
  }

  // gets the location of a specified account operator
  function getLocation(IComponents components, uint256 id) internal view returns (uint256) {
    return LocationComponent(getAddressById(components, LocCompID)).getValue(id);
  }

  // gets the OwnerID (address) of a specified account operator as a uint
  function getOwner(IComponents components, uint256 id) internal view returns (uint256) {
    return IdOwnerComponent(getAddressById(components, IdOwnerCompID)).getValue(id);
  }

  /////////////////
  // QUERIES

  // Get an operator entity by Wallet address. Assume only 1.
  function getByAddress(IComponents components, address wallet)
    internal
    view
    returns (uint256 result)
  {
    uint256[] memory results = _getAllX(components, wallet, 0, 0);
    if (results.length > 0) {
      result = results[0];
    }
  }

  // Get the operator of an owner. Assume only 1.
  function getByOwner(IComponents components, uint256 ownerID)
    internal
    view
    returns (uint256 result)
  {
    uint256[] memory results = _getAllX(components, address(0), ownerID, 0);
    if (results.length > 0) {
      result = results[0];
    }
  }

  // Get the operator of an owner by the owner's address. Assume only 1.
  function getByOwner(IComponents components, address owner) internal view returns (uint256) {
    return getByOwner(components, addressToEntity(owner));
  }

  // Get all operator entities matching the specified filters.
  function _getAllX(
    IComponents components,
    address wallet,
    uint256 ownerID,
    uint256 location
  ) internal view returns (uint256[] memory) {
    uint256 numFilters;
    if (wallet != address(0)) numFilters++;
    if (ownerID != 0) numFilters++;
    if (location != 0) numFilters++;

    QueryFragment[] memory fragments = new QueryFragment[](numFilters + 1);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsOperatorCompID), "");

    uint256 filterCount;
    if (wallet != address(0)) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, AddrPlayerCompID),
        abi.encode(wallet)
      );
    }
    if (ownerID != 0) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IdOwnerCompID),
        abi.encode(ownerID)
      );
    }
    if (location != 0) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, LocCompID),
        abi.encode(location)
      );
    }

    return LibQuery.query(fragments);
  }
}
