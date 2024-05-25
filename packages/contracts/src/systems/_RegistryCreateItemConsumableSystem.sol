// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibString } from "solady/utils/LibString.sol";
import { LibItemRegistry } from "libraries/LibItemRegistry.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Create.Item.Consumable"));

contract _RegistryCreateItemConsumableSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint32 index,
      string memory name,
      string memory description,
      string memory type_,
      string memory media
    ) = abi.decode(arguments, (uint32, string, string, string, string));

    uint256 registryID = LibItemRegistry.getByIndex(components, index);
    require(registryID == 0, "CreateMiscItem: item already exists");
    require(!LibString.eq(name, ""), "CreateMiscItem: name empty");

    uint256 id = LibItemRegistry.createConsumable(
      components,
      index,
      name,
      description,
      type_,
      media
    );
    return abi.encode(id);
  }

  function executeTyped(
    uint32 index,
    string memory name,
    string memory description,
    string memory type_,
    string memory media
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, name, description, type_, media));
  }
}
