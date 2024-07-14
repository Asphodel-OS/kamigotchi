// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { PlayerSystem } from "systems/base/PlayerSystem.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibGoals } from "libraries/LibGoals.sol";

uint256 constant ID = uint256(keccak256("system.Goal.Claim"));

contract GoalClaimSystem is PlayerSystem {
  constructor(IWorld _world, address _components) PlayerSystem(_world, _components) {}

  function execute(bytes memory arguments) public notPaused returns (bytes memory) {
    uint32 goalIndex = abi.decode(arguments, (uint32));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    uint256 goalID = LibGoals.getByIndex(components, goalIndex);
    require(goalID != 0, "goal not found");
    require(LibGoals.canClaim(components, goalID, accountID), "cannot claim from this goal");

    LibGoals.distributeRewards(world, components, goalIndex, goalID, accountID);
    LibGoals.setClaimed(components, goalID, accountID);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);

    return "";
  }

  function executeTyped(uint32 goalIndex) public notPaused returns (bytes memory) {
    return execute(abi.encode(goalIndex));
  }
}
