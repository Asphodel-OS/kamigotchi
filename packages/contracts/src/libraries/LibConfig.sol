// SPDX-License-Identifier: AGPL-3.0-only
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

  function set(IUintComp comps, string memory field, uint256 value) internal {
    uint256 id = genID(field);
    ValueComponent(getAddrByID(comps, ValueCompID)).set(id, value);
  }

  function setAddress(IUintComp comps, string memory field, address value) internal {
    set(comps, field, uint256(uint160(value)));
  }

  /// @notice Set an array of values of a global config field entity
  function setArray(IUintComp comps, string memory field, uint32[8] memory values) internal {
    set(comps, field, LibPack.packArrU32(values));
  }

  function setBool(IUintComp comps, string memory field, bool value) internal {
    uint256 id = genID(field);
    if (value) ValueComponent(getAddrByID(comps, ValueCompID)).set(id, 1);
    else ValueComponent(getAddrByID(comps, ValueCompID)).remove(id);
  }

  /// @notice Set a string value of a global config field entity
  function setString(IUintComp comps, string memory field, string memory value) internal {
    require(bytes(value).length < 32, "LibConfig: string too long");
    require(bytes(value).length > 0, "LibConfig: string too short");
    set(comps, field, LibPack.stringToUint(value));
  }

  //////////////////
  // CHECKERS

  function has(IUintComp comps, string memory field) internal view returns (bool) {
    uint256 id = genID(field);
    return ValueComponent(getAddrByID(comps, ValueCompID)).has(id);
  }

  //////////////////
  // GETTERS

  /// @notice Retrieve the value (without precision) of a global config field entity. Assumes it exists
  /// @dev let call revert if value does not exist
  function get(IUintComp comps, string memory field) internal view returns (uint256) {
    return ValueComponent(getAddrByID(comps, ValueCompID)).get(genID(field));
  }

  function getAddress(IUintComp comps, string memory field) internal view returns (address) {
    return address(uint160(get(comps, field)));
  }

  /// @notice Retrieves a batch of values (without precision). Assumes all exists
  function get(IUintComp comps, string[] memory fields) internal view returns (uint256[] memory) {
    uint256[] memory ids = new uint256[](fields.length);
    for (uint256 i = 0; i < fields.length; i++) ids[i] = genID(fields[i]);
    return ValueComponent(getAddrByID(comps, ValueCompID)).get(ids);
  }

  function getAddr(
    IUintComp comps,
    string[] memory fields
  ) internal view returns (address[] memory addrs) {
    uint256[] memory raws = get(comps, fields);
    addrs = new address[](raws.length);
    for (uint256 i = 0; i < raws.length; i++) addrs[i] = address(uint160(raws[i]));
  }

  /// @notice Retrieve an array of values. Assumes it exists
  function getArray(IUintComp comps, string memory name) internal view returns (uint32[8] memory) {
    uint256 id = genID(name);
    return LibPack.unpackArrU32(ValueComponent(getAddrByID(comps, ValueCompID)).get(id));
  }

  function getBool(IUintComp comps, string memory name) internal view returns (bool) {
    return has(comps, name);
  }

  /// @notice Retrieve the string value of a global config field entity. Assumes it exists
  function getString(IUintComp comps, string memory name) internal view returns (string memory) {
    uint256 id = genID(name);
    return LibPack.uintToString(ValueComponent(getAddrByID(comps, ValueCompID)).get(id));
  }
}
