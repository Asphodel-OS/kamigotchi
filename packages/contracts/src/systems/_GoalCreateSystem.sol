// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { Condition } from "libraries/utils/LibBoolean.sol";
import { LibGoals } from "libraries/LibGoals.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system.Goal.Create"));

contract _GoalCreateSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint32 goalIndex,
      string memory name,
      string memory description,
      uint32 roomIndex,
      string memory objType,
      string memory objLogic,
      uint32 objIndex,
      uint256 objValue
    ) = abi.decode(arguments, (uint32, string, string, uint32, string, string, uint32, uint256));
    Condition memory objective = Condition(objType, objLogic, objIndex, objValue);

    // check that the goal exists
    require(LibGoals.getByIndex(components, goalIndex) == 0, "Goal alr exist");
    require(!LibString.eq(name, ""), "Goal name cannot be empty");
    require(!LibString.eq(objective.type_, ""), "Goal type cannot be empty");
    require(!LibString.eq(objective.logic, ""), "Goal logic cannot be empty");

    uint256 id = LibGoals.create(components, goalIndex, name, description, roomIndex, objective);

    return abi.encode(id);
  }

  function executeTyped(
    uint32 goalIndex,
    string memory name,
    string memory description,
    uint32 roomIndex,
    string memory objType,
    string memory objLogic,
    uint32 objIndex,
    uint256 objValue
  ) public onlyOwner returns (bytes memory) {
    return
      execute(
        abi.encode(goalIndex, name, description, roomIndex, objType, objLogic, objIndex, objValue)
      );
  }
}
