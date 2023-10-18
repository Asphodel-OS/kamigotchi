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

uint256 constant ID = uint256(keccak256("system.Skill.Upgrade"));

// upgrade a skill
contract SkillUpgradeSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 id, uint256 skillIndex) = abi.decode(arguments, (uint256, uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    // entity type check
    bool isPet = LibPet.isPet(components, id);
    bool isAccount = LibAccount.isAccount(components, id);
    require(isPet || isAccount, "SkillUpgrade: invalid target");

    // generic requirements
    if (isAccount) {
      require(accountID == id, "SkillUpgrade: not ur account");
    } else if (isPet) {
      require(accountID == LibPet.getAccount(components, id), "SkillUpgrade: not ur pet");
      require(
        LibPet.getLocation(components, id) == LibAccount.getLocation(components, accountID),
        "SkillUpgrade: must be in same room"
      );
    }

    // check that the skill exists
    uint256 registryID = LibRegistrySkill.getByIndex(components, skillIndex);
    require(registryID != 0, "SkillUpgrade: skill not found");

    // points are decremented when checking prerequisites
    require(
      LibSkill.meetsPrerequisites(components, id, skillIndex),
      "SkillUpgrade: unmet prerequisites"
    );

    // decrement the skill cost
    uint256 cost = LibRegistrySkill.getCost(components, registryID);
    LibSkill.dec(components, id, cost);

    // create the skill if it doesnt exist and increment it
    uint256 skillID = LibSkill.get(components, id, skillIndex);
    if (skillID == 0) skillID = LibSkill.create(world, components, id, skillIndex);
    LibSkill.inc(components, skillID, 1);

    // get the skill's effects. for any stat effects update the holder's bonus
    uint256 bonusID;
    string memory type_;
    uint256[] memory effectIDs = LibRegistrySkill.getEffectsByIndex(components, skillIndex);
    for (uint256 i = 0; i < effectIDs.length; i++) {
      // determine the type of the Bonus entity to be affected
      type_ = LibRegistrySkill.getType(components, effectIDs[i]);
      if (!LibString.eq("STAT", type_)) {
        type_ = LibString.concat(type_, "_");
        type_ = LibString.concat(type_, LibRegistrySkill.getSubtype(components, effectIDs[i]));
      }

      // get the bonus entity or create one if it doesnt exist
      bonusID = LibBonus.get(components, id, type_);
      if (bonusID == 0) bonusID = LibBonus.create(world, components, id, type_);

      // update the appropriate bonus entity
      if (LibString.eq("STAT", type_)) {
        LibSkill.processStatEffectUpgrade(components, id, effectIDs[i]);
      } else {
        LibSkill.processEffectUpgrade(components, id, effectIDs[i], type_);
      }
    }

    LibAccount.updateLastBlock(components, accountID);
    return "";
  }

  function executeTyped(uint256 id, uint256 skillIndex) public returns (bytes memory) {
    return execute(abi.encode(id, skillIndex));
  }
}
