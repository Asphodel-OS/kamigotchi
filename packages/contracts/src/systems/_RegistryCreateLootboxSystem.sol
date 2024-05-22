// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibString } from "solady/utils/LibString.sol";
import { LibItemRegistry } from "libraries/LibItemRegistry.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Lootbox.Create"));

contract _RegistryCreateLootboxSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint32 index,
      string memory name,
      string memory description,
      uint32[] memory keys,
      uint256[] memory weights,
      string memory media
    ) = abi.decode(arguments, (uint32, string, string, uint32[], uint256[], string));

    uint256 registryID = LibItemRegistry.getByIndex(components, index);
    require(!LibString.eq(name, ""), "CreateLootbox: name empty");

    LibItemRegistry.createLootbox(components, index, name, description, keys, weights, media);

    return "";
  }

  function executeTyped(
    uint32 index,
    string memory name,
    string memory description,
    uint32[] memory keys,
    uint256[] memory weights,
    string memory media
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, name, description, keys, weights, media));
  }
}
