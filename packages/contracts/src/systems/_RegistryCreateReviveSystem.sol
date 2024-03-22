// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRegistryItem } from "libraries/LibRegistryItem.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Revive.Create"));

// _RegistryCreateReviveSystem creates an item registry entry for a Revive item
contract _RegistryCreateReviveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint32 index,
      string memory name,
      string memory description,
      int32 health,
      string memory media
    ) = abi.decode(arguments, (uint32, string, string, int32, string));
    uint256 registryID = LibRegistryItem.getByIndex(components, index);

    require(!LibString.eq(name, ""), "CreateRevive: name is empty");
    require(health > 0, "CreateRevive: health not > 0");

    LibRegistryItem.createRevive(components, index, name, description, health, media);

    return "";
  }

  function executeTyped(
    uint32 index,
    string memory name,
    string memory description,
    int32 health,
    string memory media
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, name, description, health, media));
  }
}
