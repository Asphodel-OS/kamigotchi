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
    (
      uint32 index,
      string memory name,
      string memory description,
      string memory endText,
      uint256 points,
      uint256 duration
    ) = abi.decode(arguments, (uint32, string, string, string, uint256, uint256));

    uint256 regID = LibRegistryQuests.createQuest(
      components,
      index,
      name,
      description,
      endText,
      points
    );

    // set repeatable (if so)
    if (duration > 0) {
      LibRegistryQuests.setRepeatable(components, regID, duration);
    }

    return abi.encode(regID);
  }

  function executeTyped(
    uint32 index,
    string memory name,
    string memory description,
    string memory endText,
    uint256 points,
    uint256 duration
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, name, description, endText, points, duration));
  }
}
