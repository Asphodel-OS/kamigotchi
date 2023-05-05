// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRegistryItem } from "libraries/LibRegistryItem.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Revive.Update"));

// update an item registry entry for a Revive item
contract _RegistryUpdateReviveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint256 index, string memory name, uint256 health) = abi.decode(
      arguments,
      (uint256, string, uint256)
    );
    uint256 registryID = LibRegistryItem.getByReviveIndex(components, index);

    require(registryID != 0, "Item Registry: Revive index does not exist");

    LibRegistryItem.setRevive(components, index, name, health);
    return "";
  }

  function executeTyped(
    uint256 index,
    string memory name,
    uint256 health
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, name, health));
  }
}
