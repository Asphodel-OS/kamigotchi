// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRegistryTrait } from "libraries/LibRegistryTrait.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Trait.Create"));

// Adds a trait to the registry.
// Traits are condensed here with a string identifier to reduce number of systems
contract _RegistryCreateTraitSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint32 index,
      int32 health,
      int32 power,
      int32 violence,
      int32 harmony,
      int32 slots,
      uint256 rarity,
      string memory affinity,
      string memory name,
      string memory traitType
    ) = abi.decode(
        arguments,
        (uint32, int32, int32, int32, int32, int32, uint256, string, string, string)
      );

    if (LibString.eq(traitType, "BODY")) {
      LibRegistryTrait.createBody(
        world,
        components,
        index,
        name,
        health,
        power,
        violence,
        harmony,
        slots,
        rarity,
        affinity
      );
    } else if (LibString.eq(traitType, "BACKGROUND")) {
      LibRegistryTrait.createBackground(
        world,
        components,
        index,
        name,
        health,
        power,
        violence,
        harmony,
        slots,
        rarity
      );
    } else if (LibString.eq(traitType, "COLOR")) {
      LibRegistryTrait.createColor(
        world,
        components,
        index,
        name,
        health,
        power,
        violence,
        harmony,
        slots,
        rarity
      );
    } else if (LibString.eq(traitType, "FACE")) {
      LibRegistryTrait.createFace(
        world,
        components,
        index,
        name,
        health,
        power,
        violence,
        harmony,
        slots,
        rarity
      );
    } else if (LibString.eq(traitType, "HAND")) {
      LibRegistryTrait.createHand(
        world,
        components,
        index,
        name,
        health,
        power,
        violence,
        harmony,
        slots,
        rarity,
        affinity
      );
    } else {
      revert("invalid traitType");
    }

    return "";
  }

  function executeTyped(
    uint32 index,
    int32 health,
    int32 power,
    int32 violence,
    int32 harmony,
    int32 slots,
    uint256 rarity,
    string memory affinity,
    string memory name,
    string memory traitType
  ) public onlyOwner returns (bytes memory) {
    return
      execute(
        abi.encode(
          index,
          health,
          power,
          violence,
          harmony,
          slots,
          rarity,
          affinity,
          name,
          traitType
        )
      );
  }
}
