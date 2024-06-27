// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { Condition } from "libraries/utils/LibBoolean.sol";
import { LibGoals } from "libraries/LibGoals.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system.goal.registry"));

contract _GoalRegistrySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function create(bytes memory arguments) public onlyOwner returns (uint256) {
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

    return LibGoals.create(components, goalIndex, name, description, roomIndex, objective);
  }

  function addRequirement(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 goalIndex,
      string memory reqType,
      string memory reqLogic,
      uint32 reqIndex,
      uint256 reqValue
    ) = abi.decode(arguments, (uint32, string, string, uint32, uint256));
    Condition memory requirement = Condition(reqType, reqLogic, reqIndex, reqValue);
    // check that the goal exists
    require(LibGoals.getByIndex(components, goalIndex) != 0, "Goal does not exist");
    require(!LibString.eq(requirement.type_, ""), "Req type cannot be empty");
    require(!LibString.eq(requirement.logic, ""), "Req logic cannot be empty");

    return LibGoals.addRequirement(world, components, goalIndex, requirement);
  }

  function addReward(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 goalIndex,
      string memory name,
      uint256 cutoff,
      string memory rwdType,
      string memory rwdLogic,
      uint32 rwdIndex,
      uint256 rwdValue
    ) = abi.decode(arguments, (uint32, string, uint256, string, string, uint32, uint256));
    Condition memory reward = Condition(rwdType, rwdLogic, rwdIndex, rwdValue);
    // check that the goal exists
    require(LibGoals.getByIndex(components, goalIndex) != 0, "Goal does not exist");
    require(!LibString.eq(reward.type_, ""), "Req type cannot be empty");
    require(!LibString.eq(reward.logic, ""), "Req logic cannot be empty");

    return LibGoals.addReward(world, components, goalIndex, name, cutoff, reward);
  }

  function remove(uint32 goalIndex) public onlyOwner {
    require(LibGoals.getByIndex(components, goalIndex) != 0, "Goal does not exist");
    LibGoals.remove(components, goalIndex);
  }

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    require(false, "not implemented");
  }
}
