// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibString } from "solady/utils/LibString.sol";
import { LibItemRegistry } from "libraries/LibItemRegistry.sol";

uint256 constant ID = uint256(keccak256("system.item.registry"));

contract _ItemRegistrySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function createConsumable(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 index,
      string memory name,
      string memory description,
      string memory type_,
      string memory media
    ) = abi.decode(arguments, (uint32, string, string, string, string));

    uint256 registryID = LibItemRegistry.getByIndex(components, index);
    require(registryID == 0, "ItemReg: item already exists");
    require(!LibString.eq(name, ""), "ItemReg: name empty");

    return LibItemRegistry.createConsumable(components, index, name, description, type_, media);
  }

  function createLootbox(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 index,
      string memory name,
      string memory description,
      uint32[] memory keys,
      uint256[] memory weights,
      string memory media
    ) = abi.decode(arguments, (uint32, string, string, uint32[], uint256[], string));

    uint256 registryID = LibItemRegistry.getByIndex(components, index);
    require(registryID == 0, "ItemReg: item already exists");
    require(!LibString.eq(name, ""), "ItemReg: name empty");

    return
      LibItemRegistry.createLootbox(components, index, name, description, keys, weights, media);
  }

  function createFood(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 index,
      string memory name,
      string memory description,
      int32 health,
      uint256 experience,
      string memory media
    ) = abi.decode(arguments, (uint32, string, string, int32, uint256, string));

    uint256 registryID = LibItemRegistry.getByIndex(components, index);
    require(registryID == 0, "ItemReg: item already exists");
    require(!LibString.eq(name, ""), "ItemReg: name empty");

    return
      LibItemRegistry.createFood(components, index, name, description, health, experience, media);
  }

  function createRevive(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 index,
      string memory name,
      string memory description,
      int32 health,
      string memory media
    ) = abi.decode(arguments, (uint32, string, string, int32, string));

    uint256 registryID = LibItemRegistry.getByIndex(components, index);
    require(registryID == 0, "ItemReg: item already exists");
    require(!LibString.eq(name, ""), "ItemReg: name empty");

    return LibItemRegistry.createRevive(components, index, name, description, health, media);
  }

  function remove(uint32 index) public onlyOwner {
    uint256 registryID = LibItemRegistry.getByIndex(components, index);
    require(registryID != 0, "ItemReg: item does not exist");

    LibItemRegistry.deleteItem(components, registryID);
  }

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }
}
