// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibSkillRegistry } from "libraries/LibSkillRegistry.sol";
import { LibSkill } from "libraries/LibSkill.sol";

uint256 constant ID = uint256(keccak256("system.Skill.Upgrade"));

// upgrade a skill
contract SkillUpgradeSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
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
      require(
        LibPet.getRoom(components, holderID) == LibAccount.getRoom(components, accountID),
        "SkillUpgrade: must be in same room"
      );

      // NOTE: we don't block skill upgrading by cooldown time or pet status
      // but we need to sync in advance to get accurate historical output
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

    // NOTE: we sync the pet a second time here, because the updated Production Rate
    // informs the FE. it's gas inefficient, but it keeps the code sane up there.
    // Can consider wiping once the calculations are mirrored on the FE.
    if (isPet) LibPet.sync(components, holderID);

    // standard logging and tracking
    LibSkill.logUsePoint(components, accountID);
    LibSkill.logUseTreePoint(components, holderID, registryID, cost);
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(uint256 holderID, uint32 skillIndex) public returns (bytes memory) {
    return execute(abi.encode(holderID, skillIndex));
  }
}
