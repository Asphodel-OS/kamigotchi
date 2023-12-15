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

    // check that the skill exists
    uint256 registryID = LibRegistrySkill.getByIndex(components, skillIndex);
    require(registryID != 0, "SkillUpgrade: skill not found");

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

      // NOTE: we don't block skill upgrading by cooldown time or pet status
      // but we need to sync in advance to get accurate historical output
      LibPet.sync(components, id);
    }

    // points are decremented when checking prerequisites
    require(
      LibSkill.meetsPrerequisites(components, id, registryID),
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
    string memory subtype;
    uint256[] memory effectIDs = LibRegistrySkill.getEffectsByIndex(components, skillIndex);
    for (uint256 i = 0; i < effectIDs.length; i++) {
      // determine the type of the Bonus entity to be affected
      type_ = LibRegistrySkill.getType(components, effectIDs[i]);
      subtype = LibRegistrySkill.getSubtype(components, effectIDs[i]);
      if (!LibString.eq("STAT", type_)) {
        type_ = LibString.concat(type_, "_");
        type_ = LibString.concat(type_, subtype);
      }

      // get the bonus entity or create one if it doesnt exist
      // default the initial value of new Bonus to 0 if Cooldown type
      bonusID = LibBonus.get(components, id, type_);
      if (bonusID == 0) {
        bonusID = LibBonus.create(world, components, id, type_);
        if (LibString.eq("COOLDOWN", subtype)) LibBonus.setValue(components, bonusID, 0);
      }

      // update the appropriate bonus entity
      if (LibString.eq("STAT", type_)) {
        LibSkill.processStatEffectUpgrade(components, id, effectIDs[i]);
      } else {
        LibSkill.processEffectUpgrade(components, id, effectIDs[i], type_);
      }
    }

    // NOTE: we sync the pet a second time here, because the updated Production Rate
    // informs the FE. it's gas inefficient, but it keeps the code sane up there.
    // Can consider wiping once the calculations are mirrored on the FE.
    LibPet.sync(components, id);
    LibAccount.updateLastBlock(components, accountID);
    return "";
  }

  function executeTyped(uint256 id, uint256 skillIndex) public returns (bytes memory) {
    return execute(abi.encode(id, skillIndex));
  }
}
