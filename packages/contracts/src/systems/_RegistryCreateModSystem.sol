// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRegistryItem } from "libraries/LibRegistryItem.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Mod.Create"));

// _RegistryCreateModSystem creates an item registry entry for a Mod item
contract _RegistryCreateModSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint256 modIndex,
      string memory name,
      uint256 health,
      uint256 power,
      uint256 harmony,
      uint256 violence
    ) = abi.decode(arguments, (uint256, string, uint256, uint256, uint256, uint256));
    uint256 registryID = LibRegistryItem.getByModIndex(components, modIndex);

    require(registryID == 0, "Item Registry: Mod index already exists");

    LibRegistryItem.createMod(world, components, modIndex, name, health, power, harmony, violence);
    return "";
  }

  function executeTyped(
    uint256 modIndex,
    string memory name,
    uint256 health,
    uint256 power,
    uint256 harmony,
    uint256 violence
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(modIndex, name, health, power, harmony, violence));
  }
}
