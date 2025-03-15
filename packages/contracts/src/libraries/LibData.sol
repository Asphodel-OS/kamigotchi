// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddrByID } from "solecs/utils.sol";
import { LibComp } from "libraries/utils/LibComp.sol";
import { LibPack } from "libraries/utils/LibPack.sol";

import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

/// @notice Library for data entity patterns. a key value store entity linked to an owner
/** @dev
 * There are 2 types of data entities, all packed and stored into a single uint256.
 * - uint256
 * - uint32[8] (to store multiple values in a single entry)
 *
 * heavily influenced by LibConfig
 */
library LibData {
  using LibComp for ValueComponent;

  function getID(
    uint256 holderID,
    uint32 index,
    string memory type_
  ) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("is.data", holderID, index, type_)));
  }

  /////////////////
  // INTERACTIONS

  function inc(IUintComp components, uint256 dataID, uint256 amt) internal {
    ValueComponent(getAddrByID(components, ValueCompID)).inc(dataID, amt);
  }

  function inc(IUintComp components, uint256[] memory dataIDs, uint256 amt) internal {
    ValueComponent(getAddrByID(components, ValueCompID)).inc(dataIDs, amt);
  }

  function inc(IUintComp components, uint256[] memory dataIDs, uint256[] memory amts) internal {
    ValueComponent(getAddrByID(components, ValueCompID)).inc(dataIDs, amts);
  }

  function inc(
    IUintComp components,
    uint256 holderID,
    uint32 index,
    string memory type_,
    uint256 amt
  ) internal {
    uint256 dataID = getID(holderID, index, type_);
    return inc(components, dataID, amt);
  }

  function inc(
    IUintComp components,
    uint256 holderID,
    uint32[] memory indices,
    string memory type_,
    uint256 amt
  ) internal {
    uint256[] memory dataIDs = new uint256[](indices.length);
    for (uint256 i; i < indices.length; i++) dataIDs[i] = getID(holderID, indices[i], type_);
    return inc(components, dataIDs, amt);
  }

  function inc(
    IUintComp components,
    uint256 holderID,
    uint32[] memory indices,
    string[] memory types,
    uint256 amt
  ) internal {
    uint256[] memory dataIDs = new uint256[](indices.length);
    for (uint256 i; i < indices.length; i++) dataIDs[i] = getID(holderID, indices[i], types[i]);
    return inc(components, dataIDs, amt);
  }

  function inc(
    IUintComp components,
    uint256 holderID,
    uint32[] memory indices,
    string memory type_,
    uint256[] memory amts
  ) internal {
    uint256[] memory dataIDs = new uint256[](indices.length);
    for (uint256 i; i < indices.length; i++) dataIDs[i] = getID(holderID, indices[i], type_);
    return inc(components, dataIDs, amts);
  }

  function inc(
    IUintComp components,
    uint256 holderID,
    uint32[] memory indices,
    string[] memory types,
    uint256[] memory amts
  ) internal {
    uint256[] memory dataIDs = new uint256[](indices.length);
    for (uint256 i; i < indices.length; i++) dataIDs[i] = getID(holderID, indices[i], types[i]);
    return inc(components, dataIDs, amts);
  }

  function dec(IUintComp components, uint256 dataID, uint256 amt) internal {
    ValueComponent(getAddrByID(components, ValueCompID)).dec(dataID, amt);
  }

  function dec(IUintComp components, uint256[] memory dataIDs, uint256 amt) internal {
    ValueComponent(getAddrByID(components, ValueCompID)).dec(dataIDs, amt);
  }

  function dec(IUintComp components, uint256[] memory dataIDs, uint256[] memory amts) internal {
    ValueComponent(getAddrByID(components, ValueCompID)).dec(dataIDs, amts);
  }

  function dec(
    IUintComp components,
    uint256 holderID,
    uint32 index,
    string memory type_,
    uint256 amt
  ) internal {
    uint256 dataID = getID(holderID, index, type_);
    return dec(components, dataID, amt);
  }

  function dec(
    IUintComp components,
    uint256 holderID,
    uint32[] memory indices,
    string[] memory types,
    uint256 amt
  ) internal {
    uint256[] memory dataIDs = new uint256[](indices.length);
    for (uint256 i; i < indices.length; i++) dataIDs[i] = getID(holderID, indices[i], types[i]);
    return dec(components, dataIDs, amt);
  }

  function dec(
    IUintComp components,
    uint256 holderID,
    uint32[] memory indices,
    string memory type_,
    uint256[] memory amts
  ) internal {
    uint256[] memory dataIDs = new uint256[](indices.length);
    for (uint256 i; i < indices.length; i++) dataIDs[i] = getID(holderID, indices[i], type_);
    return dec(components, dataIDs, amts);
  }

  function dec(
    IUintComp components,
    uint256 holderID,
    uint32[] memory indices,
    string[] memory types,
    uint256[] memory amts
  ) internal {
    uint256[] memory dataIDs = new uint256[](indices.length);
    for (uint256 i; i < indices.length; i++) dataIDs[i] = getID(holderID, indices[i], types[i]);
    return dec(components, dataIDs, amts);
  }

  function set(IUintComp components, uint256 dataID, uint256 value) internal {
    ValueComponent(getAddrByID(components, ValueCompID)).set(dataID, value);
  }

  function set(
    IUintComp components,
    uint256 holderID,
    uint32 index,
    string memory type_,
    uint256 value
  ) internal {
    uint256 dataID = getID(holderID, index, type_);
    set(components, dataID, value);
  }

  function setArray(
    IUintComp components,
    uint256 holderID,
    uint32 index,
    string memory type_,
    uint32[8] memory values
  ) internal {
    uint256 dataID = getID(holderID, index, type_);
    set(components, dataID, LibPack.packArrU32(values));
  }

  /////////////////
  // GETTERS

  function get(IUintComp components, uint256 dataID) internal view returns (uint256) {
    return ValueComponent(getAddrByID(components, ValueCompID)).safeGet(dataID);
  }

  function get(
    IUintComp components,
    uint256 holderID,
    uint32 index,
    string memory type_
  ) internal view returns (uint256) {
    uint256 dataID = getID(holderID, index, type_);
    return get(components, dataID);
  }
}
