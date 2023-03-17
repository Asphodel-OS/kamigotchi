// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRegistryItem } from "libraries/LibRegistryItem.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Equip.Update"));

// update an item registry entry for an equipment item
contract _RegistryUpdateEquipSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint256 equipIndex,
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
    uint256 registryID = LibRegistryItem.getByEquipIndex(components, equipIndex);

    require(registryID != 0, "Item Registry: Equip index does not exist");

    LibRegistryItem.setEquip(
      components,
      equipIndex,
      name,
      type_,
      health,
      power,
      harmony,
      violence,
      slots
    );
    return "";
  }

  function executeTyped(
    uint256 equipIndex,
    string memory name,
    string memory type_,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(equipIndex, name, type_, health, power, violence, harmony, slots));
  }
}
