// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IsNPCComponent, ID as IsNPCCompID } from "components/IsNPCComponent.sol";
import { IndexNPCComponent, ID as IndexNPCCompID } from "components/IndexNPCComponent.sol";
import { IndexRoomComponent, ID as IndexRoomCompID } from "components/IndexRoomComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";

/*
 * LibNPC handles all operations interacting with NPCs
 */
library LibNPC {
  // create a merchant entity as specified
  function create(
    IUintComp components,
    uint32 index,
    string memory name,
    uint32 roomIndex
  ) internal returns (uint256) {
    uint256 id = genID(index);
    IsNPCComponent(getAddressById(components, IsNPCCompID)).set(id); // TODO: change to EntityType
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
    uint256 accID
  ) internal view returns (bool) {
    IndexRoomComponent roomComp = IndexRoomComponent(getAddressById(components, IndexRoomCompID));
    uint32 roomIndex = roomComp.get(id);
    return roomIndex == 0 || roomIndex == roomComp.get(accID);
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
    return IndexNPCComponent(getAddressById(components, IndexNPCCompID)).get(id);
  }

  function getRoom(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexRoomComponent(getAddressById(components, IndexRoomCompID)).get(id);
  }

  // gets the name of a specified merchant
  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddressById(components, NameCompID)).get(id);
  }

  /////////////////
  // QUERIES

  // Return the ID of a Merchant by its index
  function get(IUintComp components, uint32 index) internal view returns (uint256 result) {
    uint256 id = genID(index);
    IsNPCComponent comp = IsNPCComponent(getAddressById(components, IsNPCCompID));
    return comp.has(id) ? id : 0;
  }

  /////////////////
  // UTILS

  function genID(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("NPC", index)));
  }
}
