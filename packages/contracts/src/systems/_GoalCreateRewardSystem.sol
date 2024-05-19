// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { Condition } from "libraries/utils/LibBoolean.sol";
import { LibGoals } from "libraries/LibGoals.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system.Goal.Create.Reward"));

contract _GoalCreateRewardSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint32 goalIndex, string memory name, uint256 cutoff, Condition memory reward) = abi.decode(
      arguments,
      (uint32, string, uint256, Condition)
    );
    // check that the goal exists
    require(LibGoals.getByIndex(components, goalIndex) != 0, "Goal does not exist");
    require(!LibString.eq(reward.type_, ""), "Req type cannot be empty");
    require(!LibString.eq(reward.logic, ""), "Req logic cannot be empty");

    uint256 id = LibGoals.addReward(world, components, goalIndex, name, cutoff, reward);

    return abi.encode(id);
  }

  function executeTyped(
    uint32 goalIndex,
    string memory name,
    uint256 cutoff,
    Condition memory reward
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(goalIndex, name, cutoff, reward));
  }
}
