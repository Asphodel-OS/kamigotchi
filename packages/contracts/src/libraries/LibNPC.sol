// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { IndexNPCComponent, ID as IndexNPCCompID } from "components/IndexNPCComponent.sol";
import { IndexRoomComponent, ID as IndexRoomCompID } from "components/IndexRoomComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";

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
    LibEntityType.set(components, id, "NPC");
    IndexNPCComponent(getAddrByID(components, IndexNPCCompID)).set(id, index);
    setName(components, id, name);
    setRoomIndex(components, id, roomIndex);
    return id;
  }

  /////////////////
  // CHECKERS

  function verifyRoom(IUintComp components, uint256 id, uint256 accID) public view {
    if (!sharesRoomWith(components, id, accID)) revert("must be in same room as npc");
  }

  // Check whether a user account shares a room with the specified merchant
  // Merchants with roomIndex 0 are considered global and are always accessible
  function sharesRoomWith(
    IUintComp components,
    uint256 id,
    uint256 accID
  ) internal view returns (bool) {
    IndexRoomComponent roomComp = IndexRoomComponent(getAddrByID(components, IndexRoomCompID));
    uint32 roomIndex = roomComp.get(id);
    return roomIndex == 0 || roomIndex == roomComp.get(accID);
  }

  /////////////////
  // SETTERS

  function setRoomIndex(IUintComp components, uint256 id, uint32 roomIndex) internal {
    IndexRoomComponent(getAddrByID(components, IndexRoomCompID)).set(id, roomIndex);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddrByID(components, NameCompID)).set(id, name);
  }

  /////////////////
  // GETTERS

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexNPCComponent(getAddrByID(components, IndexNPCCompID)).get(id);
  }

  function getRoom(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexRoomComponent(getAddrByID(components, IndexRoomCompID)).get(id);
  }

  // gets the name of a specified merchant
  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddrByID(components, NameCompID)).get(id);
  }

  /////////////////
  // QUERIES

  // Return the ID of a Merchant by its index
  function get(IUintComp components, uint32 index) internal view returns (uint256 result) {
    uint256 id = genID(index);
    return LibEntityType.isShape(components, id, "NPC") ? id : 0;
  }

  /////////////////
  // UTILS

  function genID(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("NPC", index)));
  }
}
