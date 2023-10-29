// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibString } from "solady/utils/LibString.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Mod.Create"));

// _RegistryCreateModSystem creates an item registry entry for a Mod item
contract _RegistryCreateModSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint256 index,
      uint256 modIndex,
      string memory name,
      string memory description,
      uint256 health,
      uint256 power,
      uint256 violence,
      uint256 harmony,
      string memory media
    ) = abi.decode(
        arguments,
        (uint256, uint256, string, string, uint256, uint256, uint256, uint256, string)
      );
    uint256 registryID = LibRegistryItem.getByModIndex(components, modIndex);

    require(registryID == 0, "CreateMod: index already exists");
    require(registryID != 0, "CreateMod: modIndex not found");
    require(!LibString.eq(name, ""), "CreateMod: name cannot be empty");

    LibRegistryItem.createMod(
      world,
      components,
      index,
      modIndex,
      name,
      description,
      health,
      power,
      violence,
      harmony,
      media
    );
    return "";
  }

  function executeTyped(
    uint256 index,
    uint256 modIndex,
    string memory name,
    string memory description,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    string memory media
  ) public onlyOwner returns (bytes memory) {
    return
      execute(
        abi.encode(index, modIndex, name, description, health, power, violence, harmony, media)
      );
  }
}
