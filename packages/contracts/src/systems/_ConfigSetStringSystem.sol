// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibConfig } from "libraries/LibConfig.sol";

uint256 constant ID = uint256(keccak256("system._Config.Set.String"));

// _ConfigSetStringSystem creates a global config field entity of the provided type
// and value (string) as uint. If the entry already exists, it will be overwritten.
contract _ConfigSetStringSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (string memory name, string memory value) = abi.decode(arguments, (string, string));
    uint256 configID = LibConfig.get(components, name);

    if (configID == 0) configID = LibConfig.create(world, components, name);
    LibConfig.setValueString(components, configID, value);

    return "";
  }

  function executeTyped(
    string memory name,
    string memory value
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(name, value));
  }
}
