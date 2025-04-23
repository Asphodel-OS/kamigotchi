// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { LibConfig } from "libraries/LibConfig.sol";

uint256 constant ID = uint256(keccak256("system.config.registry"));

// _ConfigSetSystem creates a global config field entity of the provided type
contract _ConfigSetSystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyAdmin(components) returns (bytes memory) {
    (string memory name, uint256 value) = abi.decode(arguments, (string, uint256));
    LibConfig.set(components, name, value);
    return "";
  }

  function executeTyped(
    string memory name,
    uint256 value
  ) public onlyAdmin(components) returns (bytes memory) {
    return execute(abi.encode(name, value));
  }

  function setValue(string memory name, uint256 value) public onlyAdmin(components) {
    LibConfig.set(components, name, value);
  }

  function setValueAddress(string memory name, address value) public onlyAdmin(components) {
    LibConfig.setAddress(components, name, value);
  }

  function setValueArray(string memory name, uint32[8] memory values) public onlyAdmin(components) {
    LibConfig.setArray(components, name, values);
  }

  function setValueBool(string memory name, bool value) public onlyAdmin(components) {
    LibConfig.setBool(components, name, value);
  }

  function setValueString(string memory name, string memory value) public onlyAdmin(components) {
    LibConfig.setString(components, name, value);
  }
}
