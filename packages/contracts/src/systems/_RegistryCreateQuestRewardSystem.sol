// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibRegistryQuests } from "libraries/LibRegistryQuests.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Quest.Reward.Create"));

// creates the Reward for an existing Quest (e.g. item, coin, experience)
contract _RegistryCreateQuestRewardSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint256 questIndex, string memory type_, uint256 index, uint256 value) = abi.decode(
      arguments,
      (uint256, string, uint256, uint256)
    );

    uint256 id = LibRegistryQuests.createEmptyReward(world, components, questIndex);

    LibRegistryQuests.setType(components, id, type_);
    if (LibString.eq(type_, "COIN")) {
      LibRegistryQuests.setValue(components, id, value);
    } else if (LibString.eq(type_, "ITEM")) {
      LibRegistryQuests.setIndex(components, id, index);
      LibRegistryQuests.setValue(components, id, value);
    } else if (LibString.eq(type_, "EXPERIENCE")) {
      LibRegistryQuests.setValue(components, id, value);
    } else {
      require(false, "unsupported quest reward type");
    }

    return "";
  }

  function executeTyped(
    uint256 questIndex,
    string memory type_,
    uint256 index, // can be empty
    uint256 value // can be empty
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(questIndex, type_, index, value));
  }
}
