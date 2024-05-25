// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
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

  function inc(IUintComp components, uint256 dataID, uint256 amt) internal returns (uint256) {
    ValueComponent comp = ValueComponent(getAddressById(components, ValueCompID));
    uint256 value = comp.has(dataID) ? comp.get(dataID) : 0;
    comp.set(dataID, value + amt);
    return value + amt;
  }

  function inc(
    IUintComp components,
    uint256 holderID,
    uint32 index,
    string memory type_,
    uint256 amt
  ) internal returns (uint256) {
    uint256 dataID = getID(holderID, index, type_);
    return inc(components, dataID, amt);
  }

  function dec(IUintComp components, uint256 dataID, uint256 amt) internal returns (uint256) {
    ValueComponent comp = ValueComponent(getAddressById(components, ValueCompID));
    uint256 value = comp.has(dataID) ? comp.get(dataID) : 0;
    comp.set(dataID, value - amt);
    return value - amt;
  }

  function dec(
    IUintComp components,
    uint256 holderID,
    uint32 index,
    string memory type_,
    uint256 amt
  ) internal returns (uint256) {
    uint256 dataID = getID(holderID, index, type_);
    return dec(components, dataID, amt);
  }

  function set(IUintComp components, uint256 dataID, uint256 value) internal {
    ValueComponent(getAddressById(components, ValueCompID)).set(dataID, value);
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

  /////////////////
  // GETTERS

  function get(IUintComp components, uint256 dataID) internal view returns (uint256) {
    ValueComponent comp = ValueComponent(getAddressById(components, ValueCompID));
    return comp.has(dataID) ? comp.get(dataID) : 0;
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
