// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibItemRegistry } from "libraries/LibItemRegistry.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Item.Delete"));

contract _RegistryDeleteItemSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    uint32 index = abi.decode(arguments, (uint32));

    uint256 registryID = LibItemRegistry.getByIndex(components, index);
    require(registryID != 0, "ItemReg: does not exists");

    LibItemRegistry.deleteItem(components, registryID);

    return "";
  }

  function executeTyped(uint32 index) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index));
  }
}
