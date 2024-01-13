// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { LibString } from "solady/utils/LibString.sol";

import { IsConfigComponent, ID as IsConfigCompID } from "components/IsConfigComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

// a config entity is a global config of field values, identified by its NameComponent
library LibConfig {
  // Create a global config field entity. Value is set separately
  function create(
    IWorld world,
    IUintComp components,
    string memory name
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsConfigComponent(getAddressById(components, IsConfigCompID)).set(id);
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
    return id;
  }

  //////////////////
  // SETTERS

  // Set the value of a global config field entity
  function setValue(IUintComp components, uint256 id, uint256 value) internal {
    ValueComponent(getAddressById(components, ValueCompID)).set(id, value);
  }

  // Packs a string value as a uint256 for a config. Max 32 chars.
  function setValueString(IUintComp components, uint256 id, string memory value) internal {
    require(bytes(value).length <= 32, "LibConfig: string too long");
    require(bytes(value).length > 0, "LibConfig: string too short");
    setValue(components, id, uint256(LibString.packOne(value)));
  }

  // set the value of a global config entity by its name
  function setValueOf(IUintComp components, string memory name, uint256 value) internal {
    uint256 id = get(components, name);
    setValue(components, id, value);
  }

  //////////////////
  // GETTERS

  // Retrieve the value of a global config field entity
  function getValue(IUintComp components, uint256 id) internal view returns (uint256) {
    return ValueComponent(getAddressById(components, ValueCompID)).getValue(id);
  }

  // Retrieve the value of a global config field entity by name. Assume it exists.
  function getValueOf(IUintComp components, string memory name) internal view returns (uint256) {
    uint256 id = get(components, name);
    return getValue(components, id);
  }

  function getValueStringOf(
    IUintComp components,
    string memory name
  ) internal view returns (string memory) {
    return _uintToString(getValueOf(components, name));
  }

  function getBatchValueOf(
    IUintComp components,
    string[] memory names
  ) public view returns (uint256[] memory) {
    uint256[] memory values = getBatch(components, names);

    ValueComponent valueComp = ValueComponent(getAddressById(components, ValueCompID));
    for (uint256 i = 0; i < names.length; i++) {
      if (values[i] != 0) values[i] = valueComp.getValue(values[i]);
    }

    return values;
  }

  function getBatchValueStringOf(
    IUintComp components,
    string[] memory names
  ) internal view returns (string[] memory) {
    string[] memory values = new string[](names.length);
    uint256[] memory ids = getBatch(components, names);

    ValueComponent valueComp = ValueComponent(getAddressById(components, ValueCompID));
    for (uint256 i = 0; i < names.length; i++) {
      if (ids[i] != 0) values[i] = _uintToString(valueComp.getValue(ids[i]));
    }

    return values;
  }

  //////////////////
  // QUERIES

  /// @notice Retrieve the ID of a config with the given type
  function get(IUintComp components, string memory name) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsConfigCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, NameCompID),
      abi.encode(name)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length > 0) {
      result = results[0];
    }
  }

  /// @notice Retrieve an array of IDs of a config with the given types
  function getBatch(
    IUintComp components,
    string[] memory names
  ) internal view returns (uint256[] memory entities) {
    entities = new uint256[](names.length);

    QueryFragment memory nameFragment = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, NameCompID),
      new bytes(0)
    );

    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsConfigCompID), "");

    for (uint256 i = 0; i < names.length; i++) {
      nameFragment.value = abi.encode(names[i]);
      fragments[1] = nameFragment;
      uint256[] memory results = LibQuery.query(fragments);
      if (results.length > 0) {
        entities[i] = results[0];
      }
    }
  }

  /////////////////////////
  // UTILITIES

  function _uintToString(uint256 value) internal pure returns (string memory) {
    return LibString.unpackOne((bytes32(abi.encodePacked(value))));
  }
}
