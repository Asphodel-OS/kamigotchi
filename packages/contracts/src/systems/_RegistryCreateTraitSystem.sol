// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRegistryItem } from "libraries/LibRegistryItem.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Trait.Create"));

// Adds a trait to the registry.
// Traits are condensed here with a string identifier to reduce number of systems
contract _RegistryCreateTraitSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint256 index,
      uint256 health,
      uint256 power,
      uint256 violence,
      uint256 harmony,
      string memory name,
      string memory traitType
    ) = abi.decode(arguments, (uint256, uint256, uint256, uint256, uint256, string, string));

    if (LibString.eq(traitType, "BODY")) {
      LibRegistryItem.createBody(world, components, index, name, health, power, violence, harmony);
    } else if (LibString.eq(traitType, "BACKGROUND")) {
      LibRegistryItem.createBackground(
        world,
        components,
        index,
        name,
        health,
        power,
        violence,
        harmony
      );
    } else if (LibString.eq(traitType, "COLOR")) {
      LibRegistryItem.createColor(world, components, index, name, health, power, violence, harmony);
    } else if (LibString.eq(traitType, "FACE")) {
      LibRegistryItem.createFace(world, components, index, name, health, power, violence, harmony);
    } else if (LibString.eq(traitType, "HAND")) {
      LibRegistryItem.createHand(world, components, index, name, health, power, violence, harmony);
    } else {
      revert("invalid traitType");
    }

    return "";
  }

  function executeTyped(
    uint256 index,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    string memory name,
    string memory traitType
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, health, power, violence, harmony, name, traitType));
  }
}
