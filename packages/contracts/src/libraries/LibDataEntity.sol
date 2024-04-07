// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { LibPack } from "libraries/utils/LibPack.sol";

import { BareValueComponent, ID as ValueCompID } from "components/BareValueComponent.sol";

/// @notice Library for data entity patterns. a key value store entity linked to an owner
/** @dev
 * There are 2 types of data entities, all packed and stored into a single uint256.
 * - uint256
 * - uint32[8] (to store multiple values in a single entry)
 *
 * heavily influenced by LibConfig
 */
library LibDataEntity {
  function getID(
    uint256 holderID,
    uint32 index,
    string memory type_
  ) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("is.data", holderID, index, type_)));
  }

  /////////////////
  // INTERACTIONS

  function inc(
    IUintComp components,
    uint256 holderID,
    uint32 index,
    string memory type_,
    uint256 amt
  ) internal returns (uint256) {
    uint256 dataID = getID(holderID, index, type_);
    BareValueComponent comp = BareValueComponent(getAddressById(components, ValueCompID));

    uint256 value = comp.has(dataID) ? comp.get(dataID) : 0;
    comp.set(dataID, value + amt);
    return value + amt;
  }

  function dec(
    IUintComp components,
    uint256 holderID,
    uint32 index,
    string memory type_,
    uint256 amt
  ) internal returns (uint256) {
    uint256 dataID = getID(holderID, index, type_);
    BareValueComponent comp = BareValueComponent(getAddressById(components, ValueCompID));

    uint256 value = comp.has(dataID) ? comp.get(dataID) : 0;
    comp.set(dataID, value - amt);
    return value - amt;
  }

  function set(
    IUintComp components,
    uint256 holderID,
    uint32 index,
    string memory type_,
    uint256 value
  ) internal {
    uint256 dataID = getID(holderID, index, type_);
    BareValueComponent(getAddressById(components, ValueCompID)).set(dataID, value);
  }

  function incArr(
    IUintComp components,
    uint256 holderID,
    uint32 index,
    string memory type_,
    uint32[8] memory amt
  ) internal {
    uint256 dataID = getID(holderID, index, type_);
    BareValueComponent comp = BareValueComponent(getAddressById(components, ValueCompID));

    uint32[8] memory value = comp.has(dataID)
      ? LibPack.unpackArrU32(comp.get(dataID))
      : [uint32(0), 0, 0, 0, 0, 0, 0, 0];
    for (uint256 i; i < 8; i++) value[i] = value[i] + amt[i];
    comp.set(dataID, LibPack.packArrU32(value));
  }

  function decArr(
    IUintComp components,
    uint256 holderID,
    uint32 index,
    string memory type_,
    uint32[8] memory amt
  ) internal {
    uint256 dataID = getID(holderID, index, type_);
    BareValueComponent comp = BareValueComponent(getAddressById(components, ValueCompID));

    uint32[8] memory value = comp.has(dataID)
      ? LibPack.unpackArrU32(comp.get(dataID))
      : [uint32(0), 0, 0, 0, 0, 0, 0, 0];
    for (uint256 i; i < 8; i++) value[i] = value[i] - amt[i];
    comp.set(dataID, LibPack.packArrU32(value));
  }

  function setArr(
    IUintComp components,
    uint256 holderID,
    uint32 index,
    string memory type_,
    uint32[8] memory value
  ) internal {
    return set(components, holderID, index, type_, LibPack.packArrU32(value));
  }

  /////////////////
  // GETTERS

  function get(
    IUintComp components,
    uint256 holderID,
    uint32 index,
    string memory type_
  ) internal view returns (uint256 result) {
    uint256 dataID = getID(holderID, index, type_);
    BareValueComponent comp = BareValueComponent(getAddressById(components, ValueCompID));
    if (comp.has(dataID)) result = comp.get(dataID);
  }
}
