// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibDroptable } from "libraries/LibDroptable.sol";
import { LibItem } from "libraries/LibItem.sol";

uint256 constant ID = uint256(keccak256("system.item.registry"));

contract _ItemRegistrySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function create(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 index,
      string memory type_,
      string memory name,
      string memory description,
      string memory media
    ) = abi.decode(arguments, (uint32, string, string, string, string));
    require(LibItem.getByIndex(components, index) == 0, "item reg: index used");

    uint256 id = LibItem.createItem(components, index, type_, name, description, media);
    return id;
  }

  function createConsumable(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 index,
      string memory for_,
      string memory name,
      string memory description,
      string memory type_,
      string memory media
    ) = abi.decode(arguments, (uint32, string, string, string, string, string));
    require(LibItem.getByIndex(components, index) == 0, "item reg: index used");

    uint256 id = LibItem.createItem(components, index, type_, name, description, media);
    LibItem.setFor(components, id, for_);
    return id;
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
    require(LibItem.getByIndex(components, index) == 0, "item reg: index used");

    uint256 id = LibItem.createItem(components, index, "LOOTBOX", name, description, media);
    LibDroptable.set(components, id, keys, weights);
    return id;
  }

  function addStat(uint32 index, string memory type_, int32 value) public onlyOwner {
    uint256 registryID = LibItem.getByIndex(components, index);
    require(registryID != 0, "ItemReg: item does not exist");

    LibItem.addStat(components, registryID, type_, value);
  }

  function setRoom(uint32 index, uint32 roomIndex) public onlyOwner {
    uint256 registryID = LibItem.getByIndex(components, index);
    require(registryID != 0, "ItemReg: item does not exist");

    LibItem.setRoom(components, registryID, roomIndex);
  }

  function setUnburnable(uint32 index) public onlyOwner {
    uint256 registryID = LibItem.getByIndex(components, index);
    require(registryID != 0, "ItemReg: item does not exist");

    LibItem.setUnburnable(components, registryID);
  }

  function remove(uint32 index) public onlyOwner {
    uint256 registryID = LibItem.getByIndex(components, index);
    require(registryID != 0, "ItemReg: item does not exist");

    LibItem.deleteItem(components, registryID);
  }

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }
}
