// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibString } from "solady/utils/LibString.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Gear.Create"));

// create an item registry entry for a Gear item
contract _RegistryCreateGearSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint256 index,
      uint256 gearIndex,
      string memory name,
      string memory description,
      string memory type_,
      uint256 health,
      uint256 power,
      uint256 violence,
      uint256 harmony,
      uint256 slots,
      string memory media
    ) = abi.decode(
        arguments,
        (
          uint256,
          uint256,
          string,
          string,
          string,
          uint256,
          uint256,
          uint256,
          uint256,
          uint256,
          string
        )
      );
    uint256 registryID = LibRegistryItem.getByGearIndex(components, gearIndex);

    require(registryID == 0, "CreateGear: index alr exists");
    require(!LibString.eq(name, ""), "CreateGear: name cannot be empty");
    require(!LibString.eq(type_, ""), "CreateGear: type cannot be empty");

    LibRegistryItem.createGear(
      world,
      components,
      index,
      gearIndex,
      name,
      description,
      type_,
      health,
      power,
      violence,
      harmony,
      slots,
      media
    );
    return "";
  }

  function executeTyped(
    uint256 index,
    uint256 gearIndex,
    string memory name,
    string memory description,
    string memory type_,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots,
    string memory media
  ) public onlyOwner returns (bytes memory) {
    return
      execute(
        abi.encode(
          index,
          gearIndex,
          name,
          description,
          type_,
          health,
          power,
          violence,
          harmony,
          slots
        )
      );
  }
}
