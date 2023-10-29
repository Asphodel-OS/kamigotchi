// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRegistryItem } from "libraries/LibRegistryItem.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Revive.Create"));

// _RegistryCreateReviveSystem creates an item registry entry for a Revive item
contract _RegistryCreateReviveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint256 index,
      uint256 reviveIndex,
      string memory name,
      string memory description,
      uint256 health,
      string memory media
    ) = abi.decode(arguments, (uint256, uint256, string, string, uint256, string));
    uint256 registryID = LibRegistryItem.getByItemIndex(components, index);

    require(registryID == 0, "CreateRevive: index alr exists");
    require(!LibString.eq(name, ""), "CreateRevive: name is empty");
    require(health > 0, "CreateRevive: health not > 0");

    LibRegistryItem.createRevive(
      world,
      components,
      index,
      reviveIndex,
      name,
      description,
      health,
      media
    );

    return "";
  }

  function executeTyped(
    uint256 index,
    uint256 reviveIndex,
    string memory name,
    string memory description,
    uint256 health,
    string memory media
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, reviveIndex, name, description, health, media));
  }
}
