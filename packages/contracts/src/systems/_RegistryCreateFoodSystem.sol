// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibString } from "solady/utils/LibString.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Food.Create"));

// _RegistryCreateFoodSystem creates an item registry entry for a Food item
contract _RegistryCreateFoodSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint256 index,
      uint256 foodIndex,
      string memory name,
      string memory description,
      uint256 health,
      string memory media
    ) = abi.decode(arguments, (uint256, uint256, string, string, uint256, string));
    uint256 registryID = LibRegistryItem.getByItemIndex(components, index);

    require(!LibString.eq(name, ""), "CreateFood: name cannot be empty");
    require(health > 0, "CreateFood: health not > than 0");
    require(registryID == 0, "CreateFood: Index already exists");

    LibRegistryItem.createFood(
      world,
      components,
      index,
      foodIndex,
      name,
      description,
      health,
      media
    );

    return "";
  }

  function executeTyped(
    uint256 index,
    uint256 foodIndex,
    string memory name,
    string memory description,
    uint256 health,
    string memory media
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, foodIndex, name, description, health, media));
  }
}
