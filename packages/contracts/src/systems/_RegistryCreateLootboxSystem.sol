// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibRegistryItem } from "libraries/LibRegistryItem.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Lootbox.Create"));

contract _RegistryCreateLootboxSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint256 index, uint256[] memory keys, uint256[] memory weights, string memory name) = abi
      .decode(arguments, (uint256, uint256[], uint256[], string));

    uint256 registryID = LibRegistryItem.getByItemIndex(components, index);
    require(registryID == 0, "Item Registry: index alr exists");

    LibRegistryItem.createLootbox(world, components, index, keys, weights, name);

    return "";
  }

  function executeTyped(
    uint256 index,
    uint256[] memory keys,
    uint256[] memory weights,
    string memory name
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, keys, weights, name));
  }
}
