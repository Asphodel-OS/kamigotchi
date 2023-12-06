// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibString } from "solady/utils/LibString.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";

uint256 constant ID = uint256(keccak256("system._Registry.MiscItem.Create"));

contract _RegistryCreateMiscItemSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint256 index,
      string memory name,
      string memory description,
      bool fungible,
      string memory type_,
      string memory media
    ) = abi.decode(arguments, (uint256, string, string, bool, string, string));

    uint256 registryID = LibRegistryItem.getByItemIndex(components, index);
    require(registryID == 0, "CreateMiscItem: index alr exists");
    require(!LibString.eq(name, ""), "CreateMiscItem: name empty");

    LibRegistryItem.createMisc(world, components, index, name, description, fungible, type_, media);

    return "";
  }

  function executeTyped(
    uint256 index,
    string memory name,
    string memory description,
    bool fungible,
    string memory type_,
    string memory media
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, name, description, fungible, type_, media));
  }
}
