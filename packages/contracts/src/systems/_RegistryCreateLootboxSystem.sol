// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibString } from "solady/utils/LibString.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Lootbox.Create"));

contract _RegistryCreateLootboxSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint256 index, string memory name, uint256[] memory keys, uint256[] memory weights) = abi
      .decode(arguments, (uint256, string, uint256[], uint256[]));

    uint256 registryID = LibRegistryItem.getByItemIndex(components, index);
    require(registryID == 0, "CreateLootbox: index alr exists");
    require(!LibString.eq(name, ""), "CreateLootbox: name empty");

    LibRegistryItem.createLootbox(world, components, index, name, keys, weights);

    return "";
  }

  function executeTyped(
    uint256 index,
    string memory name,
    uint256[] memory keys,
    uint256[] memory weights
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, name, keys, weights));
  }
}
