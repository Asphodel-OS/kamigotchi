// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRegistrySkill } from "libraries/LibRegistrySkill.sol";
import { LibSkill } from "libraries/LibSkill.sol";

uint256 constant ID = uint256(keccak256("system.Account.Upgrade.Skill"));

// upgrade a skill
contract AccountUpgradeSkillSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 skillIndex = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    uint256 registryID = LibRegistrySkill.getByIndex(components, skillIndex);

    // requirements
    require(registryID != 0, "AccountUpgradeSkill: skill not found");
    require(accountID != 0, "AccountUpgradeSkill: calling account not found");
    require(
      LibSkill.meetsPrerequisites(components, accountID, registryID),
      "AccountUpgradeSkill: unmet prerequisites"
    );

    // decrement the skill cost
    uint256 cost = LibRegistrySkill.getCost(components, registryID);
    LibSkill.dec(components, accountID, cost);

    // create the skill if it doesnt exist and increment it
    uint256 skillID = LibSkill.get(components, accountID, skillIndex);
    if (skillID == 0) skillID = LibSkill.create(world, components, accountID, skillIndex);
    LibSkill.inc(components, skillID, 1);

    // get the skill's effects and update the holder's bonuses accordingly
    uint256[] memory effectIDs = LibRegistrySkill.getEffectsByIndex(components, skillIndex);
    for (uint256 i = 0; i < effectIDs.length; i++) {
      LibSkill.processEffectUpgrade(world, components, accountID, effectIDs[i]);
    }

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(uint256 skillIndex) public returns (bytes memory) {
    return execute(abi.encode(skillIndex));
  }
}
