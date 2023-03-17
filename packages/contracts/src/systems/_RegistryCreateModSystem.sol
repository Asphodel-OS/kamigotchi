// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRegistryItem } from "libraries/LibRegistryItem.sol";

uint constant ID = uint(keccak256("system._Registry.CreateMod"));

// _RegistryCreateModSystem creates an item registry entry for a Mod item
contract _RegistryCreateModSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint modIndex, string memory name, uint health, uint power, uint harmony, uint violence) = abi
      .decode(arguments, (uint, string, uint, uint, uint, uint));
    uint registryID = LibRegistryItem.getByModIndex(components, modIndex);

    require(registryID == 0, "Item Registry: Mod index already exists");

    LibRegistryItem.createMod(world, components, modIndex, name, health, power, harmony, violence);
    return "";
  }

  function executeTyped(
    uint modIndex,
    string memory name,
    uint health,
    uint power,
    uint harmony,
    uint violence
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(modIndex, name, health, power, harmony, violence));
  }
}
