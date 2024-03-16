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
import { BareValueComponent, ID as ValueCompID } from "components/BareValueComponent.sol";

/// @notice a config entity is a global config of field values, identified by its NameComponent
/** @dev
 * There are 3 types of configs, all packed and stored into a single uint256.
 * - uint256
 * - string
 * - uint32[8] (to store multiple values in a single entry)
 */
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

  /// @notice Set a value of a global config field entity
  function setValue(IUintComp components, uint256 id, uint256 value) internal {
    BareValueComponent(getAddressById(components, ValueCompID)).set(id, value);
  }

  /// @notice Set an array of values of a global config field entity
  function setValueArray(IUintComp components, uint256 id, uint32[8] memory values) internal {
    setValue(components, id, _packArray(values));
  }

  /// @notice Set a string value of a global config field entity
  function setValueString(IUintComp components, uint256 id, string memory value) internal {
    require(bytes(value).length <= 32, "LibConfig: string too long");
    require(bytes(value).length > 0, "LibConfig: string too short");
    setValue(components, id, _stringToUint(value));
  }

  //////////////////
  // GETTERS

  /// @notice Retrieve the value (without precision) of a global config field entity. Assumes it exists
  function getValue(IUintComp components, uint256 id) internal view returns (uint256) {
    return BareValueComponent(getAddressById(components, ValueCompID)).getValue(id);
  }

  /// @notice Retrieve an array of values. Assumes it exists
  function getValueArray(
    IUintComp components,
    uint256 id
  ) internal view returns (uint32[8] memory) {
    return _unpackArray(getValue(components, id));
  }

  /// @notice Retrieve the string value of a global config field entity
  function getValueString(IUintComp components, uint256 id) internal view returns (string memory) {
    return _uintToString(getValue(components, id));
  }

  /// @notice Retrieve the value (without precision) of a global config field entity. Assumes it exists
  function getValueOf(IUintComp components, string memory name) internal view returns (uint256) {
    uint256 id = get(components, name);
    return getValue(components, id);
  }

  /// @notice Retrieve an array of values. Assumes it exists
  function getValueArrayOf(
    IUintComp components,
    string memory name
  ) internal view returns (uint32[8] memory) {
    uint256 id = get(components, name);
    return getValueArray(components, id);
  }

  /// @notice Retrieve the string value of a global config field entity. Assumes it exists
  function getValueStringOf(
    IUintComp components,
    string memory name
  ) internal view returns (string memory) {
    uint256 id = get(components, name);
    return getValueString(components, id);
  }

  /// @notice Retrieves a batch of values (without precision). Assumes all exists
  function getBatchValueOf(
    IUintComp components,
    string[] memory names
  ) public view returns (uint256[] memory) {
    uint256[] memory values = getBatch(components, names);

    BareValueComponent valueComp = BareValueComponent(getAddressById(components, ValueCompID));
    for (uint256 i = 0; i < names.length; i++)
      if (values[i] != 0) values[i] = uint256(uint32(valueComp.getValue(values[i])));

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

  ////////////////////
  // UTILS

  function _stringToUint(string memory value) internal pure returns (uint256) {
    return uint256(LibString.packOne(value));
  }

  function _uintToString(uint256 value) internal pure returns (string memory) {
    return LibString.unpackOne((bytes32(abi.encodePacked(value))));
  }

  function _packArray(uint32[8] memory values) internal pure returns (uint256 result) {
    for (uint256 i; i < values.length; i++) {
      require(values[i] < (1 << 32) - 1, "max over limit");
      result = (result << 32) | values[i];
    }
  }

  // converts a bitpacked array to a regular array, fixed size of uint32[8]
  function _unpackArray(uint256 packed) internal pure returns (uint32[8] memory result) {
    for (uint256 i; i < 8; i++) {
      // packed order is reversed
      result[7 - i] = uint32(packed & ((1 << 32) - 1));
      packed = packed >> 32;
    }
  }
}
