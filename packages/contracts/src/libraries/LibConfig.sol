// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

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
  function genID(string memory name) internal pure returns (uint256 result) {
    return uint256(keccak256(abi.encodePacked("is.config", name)));
  }

  //////////////////
  // SETTERS

  function set(IUintComp components, string memory field, uint256 value) internal {
    uint256 id = genID(field);
    ValueComponent(getAddrByID(components, ValueCompID)).set(id, value);
  }

  /// @notice Set an array of values of a global config field entity
  function setArray(IUintComp components, string memory field, uint32[8] memory values) internal {
    set(components, field, LibPack.packArrU32(values));
  }

  /// @notice Set a string value of a global config field entity
  function setString(IUintComp components, string memory field, string memory value) internal {
    require(bytes(value).length < 32, "LibConfig: string too long");
    require(bytes(value).length > 0, "LibConfig: string too short");
    set(components, field, LibPack.stringToUint(value));
  }

  //////////////////
  // CHECKERS

  function has(IUintComp components, string memory field) internal view returns (bool) {
    uint256 id = genID(field);
    return ValueComponent(getAddrByID(components, ValueCompID)).has(id);
  }

  //////////////////
  // GETTERS

  /// @notice Retrieve the value (without precision) of a global config field entity. Assumes it exists
  /// @dev let call revert if value does not exist
  function get(IUintComp components, string memory field) internal view returns (uint256) {
    uint256 id = genID(field);
    return ValueComponent(getAddrByID(components, ValueCompID)).get(id);
  }

  /// @notice Retrieves a batch of values (without precision). Assumes all exists
  function get(
    IUintComp components,
    string[] memory fields
  ) internal view returns (uint256[] memory) {
    uint256[] memory ids = new uint256[](fields.length);
    for (uint256 i = 0; i < fields.length; i++) ids[i] = genID(fields[i]);
    return ValueComponent(getAddrByID(components, ValueCompID)).get(ids);
  }

  /// @notice Retrieve an array of values. Assumes it exists
  function getArray(
    IUintComp components,
    string memory name
  ) internal view returns (uint32[8] memory) {
    uint256 id = genID(name);
    return LibPack.unpackArrU32(ValueComponent(getAddrByID(components, ValueCompID)).get(id));
  }

  /// @notice Retrieve the string value of a global config field entity. Assumes it exists
  function getString(
    IUintComp components,
    string memory name
  ) internal view returns (string memory) {
    uint256 id = genID(name);
    return LibPack.uintToString(ValueComponent(getAddrByID(components, ValueCompID)).get(id));
  }
}
