// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { LibString } from "solady/utils/LibString.sol";
import { LibPack } from "libraries/utils/LibPack.sol";

import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

/// @notice a config entity is a global config of field values, identified deterministically
/** @dev
 * There are 3 types of configs, all packed and stored into a single uint256.
 * - uint256
 * - string
 * - uint32[8] (to store multiple values in a single entry)
 */
library LibConfig {
  /// @notice Retrieve the ID of a config with the given type
  function getID(string memory name) internal pure returns (uint256 result) {
    return uint256(keccak256(abi.encodePacked("is.config", name)));
  }

  //////////////////
  // SETTERS

  function set(IUintComp components, string memory field, uint256 value) internal {
    setValue(components, getID(field), value);
  }

  /// @notice Set a value of a global config field entity
  function setValue(IUintComp components, uint256 id, uint256 value) internal {
    ValueComponent(getAddressById(components, ValueCompID)).set(id, value);
  }

  /// @notice Set an array of values of a global config field entity
  function setValueArray(IUintComp components, uint256 id, uint32[8] memory values) internal {
    setValue(components, id, LibPack.packArrU32(values));
  }

  /// @notice Set a string value of a global config field entity
  function setValueString(IUintComp components, uint256 id, string memory value) internal {
    require(bytes(value).length < 32, "LibConfig: string too long");
    require(bytes(value).length > 0, "LibConfig: string too short");
    setValue(components, id, LibPack.stringToUint(value));
  }

  //////////////////
  // CHECKERS

  function has(IUintComp components, string memory name) internal view returns (bool) {
    uint256 id = getID(name);
    return ValueComponent(getAddressById(components, ValueCompID)).has(id);
  }

  //////////////////
  // GETTERS

  /// @notice Retrieve the value (without precision) of a global config field entity. Assumes it exists
  function get(IUintComp components, string memory name) internal view returns (uint256) {
    uint256 id = getID(name);
    return getValue(components, id);
  }

  /// @notice Retrieve an array of values. Assumes it exists
  function getArray(
    IUintComp components,
    string memory name
  ) internal view returns (uint32[8] memory) {
    uint256 id = getID(name);
    return getValueArray(components, id);
  }

  /// @notice Retrieve the string value of a global config field entity. Assumes it exists
  function getString(
    IUintComp components,
    string memory name
  ) internal view returns (string memory) {
    uint256 id = getID(name);
    return getValueString(components, id);
  }

  /// @notice Retrieves a batch of values (without precision). Assumes all exists
  function getBatch(
    IUintComp components,
    string[] memory names
  ) public view returns (uint256[] memory) {
    uint256[] memory values = new uint256[](names.length);
    for (uint256 i = 0; i < names.length; i++) values[i] = getID(names[i]);

    ValueComponent valueComp = ValueComponent(getAddressById(components, ValueCompID));
    for (uint256 i = 0; i < names.length; i++)
      if (values[i] != 0) values[i] = uint256(uint32(valueComp.get(values[i])));

    return values;
  }

  /// @notice Retrieve the value (without precision) of a global config field entity. Assumes it exists
  function getValue(IUintComp components, uint256 id) internal view returns (uint256) {
    return ValueComponent(getAddressById(components, ValueCompID)).get(id);
  }

  /// @notice Retrieve an array of values. Assumes it exists
  function getValueArray(
    IUintComp components,
    uint256 id
  ) internal view returns (uint32[8] memory) {
    return LibPack.unpackArrU32(getValue(components, id));
  }

  /// @notice Retrieve the string value of a global config field entity
  function getValueString(IUintComp components, uint256 id) internal view returns (string memory) {
    return LibPack.uintToString(getValue(components, id));
  }
}
