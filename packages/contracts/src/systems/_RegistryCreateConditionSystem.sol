// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRegistryQuests } from "libraries/LibRegistryQuests.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Condition.Create"));

// creates conditions (reward, requirement, objective) for a quest.
// must be called after quest is created
contract _RegistryCreateConditionSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint256 questIndex,
      uint256 balance,
      uint256 itemIndex,
      string memory name,
      string memory logicType,
      string memory _type,
      string memory conditionType
    ) = abi.decode(arguments, (uint256, uint256, uint256, string, string, string, string));

    uint256 id = LibRegistryQuests.createEmptyCondition(
      world,
      components,
      questIndex,
      name,
      logicType
    );

    if (LibString.eq(conditionType, "OBJECTIVE")) {
      LibRegistryQuests.declareObjective(components, id);
    } else if (LibString.eq(conditionType, "REQUIREMENT")) {
      LibRegistryQuests.declareRequirement(components, id);
    } else if (LibString.eq(conditionType, "REWARD")) {
      LibRegistryQuests.declareReward(components, id);
    } else {
      require(false, "invalid condition type");
    }

    // TODO: switch statement based on logicType, type, and conditionType
    LibRegistryQuests.addBalance(world, components, id, balance, itemIndex, _type);

    return "";
  }

  function executeTyped(
    uint256 index,
    uint256 balance, // can be empty
    uint256 itemIndex, // can be empty
    string memory name,
    string memory logicType,
    string memory _type,
    string memory conditionType
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, balance, itemIndex, name, logicType, _type, conditionType));
  }
}
