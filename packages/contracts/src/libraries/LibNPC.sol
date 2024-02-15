// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IsNPCComponent, ID as IsNPCCompID } from "components/IsNPCComponent.sol";
import { IndexNPCComponent, ID as IndexNPCCompID } from "components/IndexNPCComponent.sol";
import { IndexRoomComponent, ID as IndexRoomCompID } from "components/IndexRoomComponent.sol";
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
    uint32 index,
    string memory name,
    uint32 roomIndex
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsNPCComponent(getAddressById(components, IsNPCCompID)).set(id);
    IndexNPCComponent(getAddressById(components, IndexNPCCompID)).set(id, index);
    setName(components, id, name);
    setRoomIndex(components, id, roomIndex);
    return id;
  }

  /////////////////
  // CHECKERS

  // Check whether a user account shares a room with the specified merchant
  // Merchants with roomIndex 0 are considered global and are always accessible
  function sharesRoomWith(
    IUintComp components,
    uint256 id,
    uint256 accountID
  ) internal view returns (bool) {
    IndexRoomComponent roomComp = IndexRoomComponent(getAddressById(components, IndexRoomCompID));
    uint32 roomIndex = roomComp.getValue(id);
    return roomIndex == 0 || roomIndex == roomComp.getValue(accountID);
  }

  /////////////////
  // SETTERS

  function setRoomIndex(IUintComp components, uint256 id, uint32 roomIndex) internal {
    IndexRoomComponent(getAddressById(components, IndexRoomCompID)).set(id, roomIndex);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
  }

  /////////////////
  // GETTERS

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexNPCComponent(getAddressById(components, IndexNPCCompID)).getValue(id);
  }

  function getRoom(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexRoomComponent(getAddressById(components, IndexRoomCompID)).getValue(id);
  }

  // gets the name of a specified merchant
  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddressById(components, NameCompID)).getValue(id);
  }

  /////////////////
  // QUERIES

  // Return the ID of a Merchant by its index
  function getByIndex(IUintComp components, uint32 index) internal view returns (uint256 result) {
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
