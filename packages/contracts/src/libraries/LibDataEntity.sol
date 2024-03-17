// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";

import { BareValueComponent, ID as ValueCompID } from "components/BareValueComponent.sol";

/// @notice Library for data entity patterns. a key value store entity linked to an owner
library LibDataEntity {
  function getID(
    uint256 holderID,
    uint32 index,
    string memory type_
  ) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("Is.Data", holderID, index, type_)));
  }

  /////////////////
  // INTERACTIONS

  function inc(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint32 index,
    string memory type_,
    uint256 amt
  ) internal {
    uint256 dataID = getID(holderID, index, type_);
    BareValueComponent comp = BareValueComponent(getAddressById(components, ValueCompID));

    uint256 value = comp.has(dataID) ? comp.getValue(dataID) : 0;
    comp.set(dataID, value + amt);
  }

  function dec(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint32 index,
    string memory type_,
    uint256 amt
  ) internal {
    uint256 dataID = getID(holderID, index, type_);
    BareValueComponent comp = BareValueComponent(getAddressById(components, ValueCompID));

    uint256 value = comp.has(dataID) ? comp.getValue(dataID) : 0;
    comp.set(dataID, value - amt);
  }

  function set(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint32 index,
    string memory type_,
    uint256 value
  ) internal {
    uint256 dataID = getID(holderID, index, type_);
    BareValueComponent(getAddressById(components, ValueCompID)).set(dataID, value);
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
    if (comp.has(dataID)) result = comp.getValue(dataID);
  }
}
