// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRegistryQuests } from "libraries/LibRegistryQuests.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Quest.Objective.Create"));

// creates an Objective for an existing Quest (e.g. coin, item)
// this can be based on either accrual (from quest start) or current state
contract _RegistryCreateQuestObjectiveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint256 questIndex,
      string memory name,
      string memory logicType,
      string memory type_,
      uint256 index, // generic index
      uint256 value
    ) = abi.decode(arguments, (uint256, string, string, string, uint256, uint256));

    uint256 id = LibRegistryQuests.createEmptyObjective(world, components, questIndex, name);

    LibRegistryQuests.setLogicType(components, id, logicType);
    LibRegistryQuests.setType(components, id, type_);
    if (LibString.eq(type_, "COIN")) {
      LibRegistryQuests.setValue(components, id, value);
    } else if (LibString.eq(type_, "ITEM")) {
      LibRegistryQuests.setIndex(components, id, index);
      LibRegistryQuests.setValue(components, id, value);
    } else {
      require(false, "unsupported quest objective type");
    }

    return "";
  }

  function executeTyped(
    uint256 questIndex,
    string memory name,
    string memory logicType,
    string memory type_,
    uint256 index, // can be empty
    uint256 value
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(questIndex, name, logicType, type_, index, value));
  }
}
