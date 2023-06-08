// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibConfig } from "libraries/LibConfig.sol";

uint256 constant ID = uint256(keccak256("system._Config.Set"));

// _ConfigSetSystem creates a global config field entity of the provided type
// and value. If the entry already exists, it will be overwritten.
contract _ConfigSetSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (string memory name, uint256 value) = abi.decode(arguments, (string, uint256));
    uint256 configID = LibConfig.get(world, components, name);

    if (configID == 0) LibConfig.create(world, components, name, value);
    else LibConfig.setValue(components, configID, value);

    return "";
  }

  function executeTyped(string memory name, uint256 value) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(name, value));
  }
}
