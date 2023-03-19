// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRegistryItem } from "libraries/LibRegistryItem.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Gear.Create"));

// create an item registry entry for a Gear item
contract _RegistryCreateGearSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint256 gearIndex,
      string memory name,
      string memory type_,
      uint256 health,
      uint256 power,
      uint256 violence,
      uint256 harmony,
      uint256 slots
    ) = abi.decode(
        arguments,
        (uint256, string, string, uint256, uint256, uint256, uint256, uint256)
      );
    uint256 registryID = LibRegistryItem.getByGearIndex(components, gearIndex);

    require(registryID == 0, "Item Registry: Equip index already exists");

    LibRegistryItem.createGear(
      world,
      components,
      gearIndex,
      name,
      type_,
      health,
      power,
      violence,
      harmony,
      slots
    );
    return "";
  }

  function executeTyped(
    uint256 gearIndex,
    string memory name,
    string memory type_,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(gearIndex, name, type_, health, power, violence, harmony, slots));
  }
}
