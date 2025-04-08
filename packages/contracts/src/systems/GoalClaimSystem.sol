// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibGoal } from "libraries/LibGoal.sol";

uint256 constant ID = uint256(keccak256("system.goal.claim"));

contract GoalClaimSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint32 goalIndex = abi.decode(arguments, (uint32));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    uint256 goalID = LibGoal.getByIndex(components, goalIndex);
    if (goalID == 0) revert("goal not found");
    LibGoal.verifyEnabled(components, goalIndex);
    LibGoal.verifyClaimable(components, goalID, accID);

    LibGoal.distributeRewards(world, components, goalIndex, goalID, accID);
    LibGoal.setClaimed(components, goalID, accID);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(uint32 goalIndex) public returns (bytes memory) {
    return execute(abi.encode(goalIndex));
  }
}
