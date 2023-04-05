// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRegistryTrait } from "libraries/LibRegistryTrait.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Trait.Update"));

// Adds a trait to the registry.
// Traits are condensed here with a string identifier to reduce number of systems
contract _RegistryUpdateTraitSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint256 index,
      uint256 health,
      uint256 power,
      uint256 violence,
      uint256 harmony,
      uint256 slots,
      uint256 rarity,
      string memory affinity,
      string memory name,
      string memory traitType
    ) = abi.decode(
        arguments,
        (uint256, uint256, uint256, uint256, uint256, uint256, uint256, string, string, string)
      );

    if (LibString.eq(traitType, "BODY")) {
      LibRegistryTrait.setBody(
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
      LibRegistryTrait.setBackground(
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
      LibRegistryTrait.setColor(
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
      LibRegistryTrait.setFace(
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
    } else if (LibString.eq(traitType, "HAND")) {
      LibRegistryTrait.setHand(
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
    uint256 index,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots,
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
