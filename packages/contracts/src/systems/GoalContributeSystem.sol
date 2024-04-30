// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibGoals } from "libraries/LibGoals.sol";

uint256 constant ID = uint256(keccak256("system.Goal.Contribute"));

contract GoalContributeSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint32 goalIndex, uint256 amt) = abi.decode(arguments, (uint32, uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    uint256 goalID = LibGoals.getByIndex(components, goalIndex);
    require(goalID != 0, "goal not found");
    require(
      LibGoals.canContribute(components, goalIndex, goalID, accountID),
      "cannot contribute to this goal"
    );

    amt = LibGoals.contribute(components, accountID, goalID, amt);

    // standard logging and tracking
    LibGoals.logContribution(components, accountID, amt);
    LibAccount.updateLastTs(components, accountID);

    return "";
  }

  function executeTyped(uint32 goalIndex, uint256 amt) public returns (bytes memory) {
    return execute(abi.encode(goalIndex, amt));
  }
}
