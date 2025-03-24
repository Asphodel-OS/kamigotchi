// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibString } from "solady/utils/LibString.sol";

import { Condition } from "libraries/LibConditional.sol";
import { LibDisabled } from "libraries/utils/LibDisabled.sol";
import { LibGoals } from "libraries/LibGoals.sol";
import { LibAllo } from "libraries/LibAllo.sol";

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
    Condition memory objective = Condition(objType, objLogic, objIndex, objValue, ""); // no for

    // check that the goal exists
    require(LibGoals.getByIndex(components, goalIndex) == 0, "Goal alr exist");
    require(!LibString.eq(name, ""), "Goal name cannot be empty");
    require(!LibString.eq(objective.type_, ""), "Goal type cannot be empty");
    require(!LibString.eq(objective.logic, ""), "Goal logic cannot be empty");

    return LibGoals.create(components, goalIndex, name, description, roomIndex, objective);
  }

  function setDisabled(uint32 index, bool disabled) public onlyOwner {
    uint256 goalID = LibGoals.getByIndex(components, index);
    require(goalID != 0, "Goal does not exist");

    LibDisabled.set(components, goalID, disabled);
  }

  function addRequirement(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 goalIndex,
      string memory reqType,
      string memory reqLogic,
      uint32 reqIndex,
      uint256 reqValue,
      string memory reqFor
    ) = abi.decode(arguments, (uint32, string, string, uint32, uint256, string));
    Condition memory requirement = Condition(reqType, reqLogic, reqIndex, reqValue, reqFor);
    // check that the goal exists
    require(LibGoals.getByIndex(components, goalIndex) != 0, "Goal does not exist");
    require(!LibString.eq(requirement.type_, ""), "Req type cannot be empty");
    require(!LibString.eq(requirement.logic, ""), "Req logic cannot be empty");

    return LibGoals.addRequirement(world, components, goalIndex, requirement);
  }

  function addRewardBasic(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 goalIndex,
      string memory name,
      uint256 cutoff,
      string memory type_,
      uint32 index,
      uint256 value
    ) = abi.decode(arguments, (uint32, string, uint256, string, uint32, uint256));

    require(LibGoals.getByIndex(components, goalIndex) != 0, "Goal does not exist");

    uint256 tierID = LibGoals.createTier(components, goalIndex, name, cutoff);
    uint256 anchorID = LibGoals.genAlloAnchor(tierID);
    uint256 id = LibAllo.createBasic(components, anchorID, type_, index, value);
    return id;
  }

  function addRewardDT(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 goalIndex,
      string memory name,
      uint256 cutoff,
      uint32[] memory keys,
      uint256[] memory weights,
      uint256 value
    ) = abi.decode(arguments, (uint32, string, uint256, uint32[], uint256[], uint256));

    require(LibGoals.getByIndex(components, goalIndex) != 0, "Goal does not exist");

    uint256 tierID = LibGoals.createTier(components, goalIndex, name, cutoff);
    uint256 anchorID = LibGoals.genAlloAnchor(tierID);
    uint256 id = LibAllo.createDT(components, anchorID, keys, weights, value);
    return id;
  }

  function addRewardStat(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 goalIndex,
      string memory name,
      uint256 cutoff,
      string memory statType,
      int32 base,
      int32 shift,
      int32 boost,
      int32 sync
    ) = abi.decode(arguments, (uint32, string, uint256, string, int32, int32, int32, int32));

    require(LibGoals.getByIndex(components, goalIndex) != 0, "Goal does not exist");

    uint256 tierID = LibGoals.createTier(components, goalIndex, name, cutoff);
    uint256 anchorID = LibGoals.genAlloAnchor(tierID);
    uint256 id = LibAllo.createStat(components, anchorID, statType, base, shift, boost, sync);
    return id;
  }

  function addRewardDisplay(bytes memory arguments) public onlyOwner returns (uint256) {
    (uint32 goalIndex, string memory name) = abi.decode(arguments, (uint32, string));

    require(LibGoals.getByIndex(components, goalIndex) != 0, "Goal does not exist");

    uint256 tierID = LibGoals.createTier(components, goalIndex, name, 0);
    uint256 anchorID = LibGoals.genAlloAnchor(tierID);
    uint256 id = LibAllo.createEmpty(components, anchorID, "Community");
    return id;
  }

  function remove(uint32 goalIndex) public onlyOwner {
    require(LibGoals.getByIndex(components, goalIndex) != 0, "Goal does not exist");
    LibGoals.remove(components, goalIndex);
  }

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    require(false, "not implemented");
  }
}
