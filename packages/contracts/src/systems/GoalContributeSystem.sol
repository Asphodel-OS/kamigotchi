// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibGoals } from "libraries/LibGoals.sol";

uint256 constant ID = uint256(keccak256("system.goal.contribute"));

contract GoalContributeSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint32 goalIndex, uint256 amt) = abi.decode(arguments, (uint32, uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    uint256 goalID = LibGoals.getByIndex(components, goalIndex);
    if (goalID == 0) revert("goal not found");
    LibGoals.verifyContributable(components, goalIndex, goalID, accID);

    amt = LibGoals.contribute(components, accID, goalID, amt);

    // standard logging and tracking
    LibGoals.logContribution(components, accID, amt);
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(uint32 goalIndex, uint256 amt) public returns (bytes memory) {
    return execute(abi.encode(goalIndex, amt));
  }
}
