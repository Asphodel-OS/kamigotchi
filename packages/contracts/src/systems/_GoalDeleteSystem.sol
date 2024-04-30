// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibGoals } from "libraries/LibGoals.sol";

uint256 constant ID = uint256(keccak256("system.Goal.Delete"));

contract _GoalDeleteSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    uint32 goalIndex = abi.decode(arguments, (uint32));
    require(LibGoals.getByIndex(components, goalIndex) != 0, "Goal does not exist");

    LibGoals.remove(components, goalIndex);
    return "";
  }

  function executeTyped(uint32 goalIndex) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(goalIndex));
  }
}
