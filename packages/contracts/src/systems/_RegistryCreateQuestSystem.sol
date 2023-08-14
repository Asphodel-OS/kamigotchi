// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRegistryQuests } from "libraries/LibRegistryQuests.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Quest.Create"));

contract _RegistryCreateQuestSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint256 index, string memory name) = abi.decode(arguments, (uint256, string));

    LibRegistryQuests.createQuest(world, components, index, name);

    return "";
  }

  function executeTyped(uint256 index, string memory name) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, name));
  }
}
