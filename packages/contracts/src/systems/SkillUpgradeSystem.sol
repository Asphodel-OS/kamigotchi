// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { PlayerSystem } from "systems/base/PlayerSystem.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibSkillRegistry } from "libraries/LibSkillRegistry.sol";
import { LibSkill } from "libraries/LibSkill.sol";

uint256 constant ID = uint256(keccak256("system.Skill.Upgrade"));

// upgrade a skill
contract SkillUpgradeSystem is PlayerSystem {
  constructor(IWorld _world, address _components) PlayerSystem(_world, _components) {}

  function execute(bytes memory arguments) public notPaused returns (bytes memory) {
    (uint256 holderID, uint32 skillIndex) = abi.decode(arguments, (uint256, uint32));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    // check that the skill exists
    uint256 registryID = LibSkillRegistry.getByIndex(components, skillIndex);
    require(registryID != 0, "SkillUpgrade: skill not found");

    // entity type check
    bool isPet = LibPet.isPet(components, holderID);
    bool isAccount = LibAccount.isAccount(components, holderID);
    require(isPet || isAccount, "SkillUpgrade: invalid target");

    // generic requirements
    if (isAccount) {
      require(accountID == holderID, "SkillUpgrade: not ur account");
    } else if (isPet) {
      require(accountID == LibPet.getAccount(components, holderID), "SkillUpgrade: not ur pet");
      require(LibPet.isResting(components, holderID), "SkillUpgrade: pet not resting");
      LibPet.sync(components, holderID);
    }

    // points are decremented when checking prerequisites
    require(
      LibSkill.meetsPrerequisites(components, holderID, registryID),
      "SkillUpgrade: unmet prerequisites"
    );

    // decrement the skill cost
    uint256 cost = LibSkillRegistry.getCost(components, registryID);
    LibSkill.dec(components, holderID, cost);

    // create the skill if it doesnt exist and increment it
    uint256 skillID = LibSkill.get(components, holderID, skillIndex);
    if (skillID == 0) skillID = LibSkill.create(components, holderID, skillIndex);
    LibSkill.inc(components, skillID, 1);

    // get the skill's effects and update the holder's bonuses accordingly
    uint256[] memory effectIDs = LibSkillRegistry.getEffectsByIndex(components, skillIndex);
    for (uint256 i = 0; i < effectIDs.length; i++) {
      LibSkill.processEffectUpgrade(components, holderID, effectIDs[i]);
    }

    // standard logging and tracking
    LibSkill.logUsePoint(components, accountID);
    LibSkill.logUseTreePoint(components, holderID, registryID, cost);
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(
    uint256 holderID,
    uint32 skillIndex
  ) public notPaused returns (bytes memory) {
    return execute(abi.encode(holderID, skillIndex));
  }
}
