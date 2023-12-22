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

uint256 constant ID = uint256(keccak256("system.Pet.Upgrade.Skill"));

// upgrade a pet's skill
contract PetUpgradeSkillSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 id, uint256 skillIndex) = abi.decode(arguments, (uint256, uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    uint256 registryID = LibRegistrySkill.getByIndex(components, skillIndex);

    // requirements
    require(registryID != 0, "PetUpgradeSkill: skill not found");
    require(LibPet.isPet(components, id), "PetUpgradeSkill: not a pet");
    require(accountID == LibPet.getAccount(components, id), "PetUpgradeSkill: not ur pet");
    require(
      LibPet.getLocation(components, id) == LibAccount.getLocation(components, accountID),
      "PetUpgradeSkill: must be in same room" // NOTE: do we want to enforce this?
    );
    require(
      LibSkill.meetsPrerequisites(components, id, registryID),
      "PetUpgradeSkill: unmet prerequisites"
    );

    // NOTE: we don't block skill upgrading by cooldown time or pet status
    // but we need to sync in advance to get accurate historical output on productions
    LibPet.sync(components, id);

    // decrement the skill cost
    uint256 cost = LibRegistrySkill.getCost(components, registryID);
    LibSkill.dec(components, id, cost);

    // create the skill if it doesnt exist and increment it
    uint256 skillID = LibSkill.get(components, id, skillIndex);
    if (skillID == 0) skillID = LibSkill.create(world, components, id, skillIndex);
    LibSkill.inc(components, skillID, 1);

    // get the skill's effects and update the holder's bonuses accordingly
    uint256[] memory effectIDs = LibRegistrySkill.getEffectsByIndex(components, skillIndex);
    for (uint256 i = 0; i < effectIDs.length; i++) {
      LibSkill.processEffectUpgrade(world, components, id, effectIDs[i]);
    }

    // NOTE: we sync the pet a second time here, because the updated Production Rate
    // informs the FE. it's gas inefficient, but it keeps the code sane up there.
    // Can consider wiping once the calculations are mirrored on the FE.
    LibPet.sync(components, id);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(uint256 id, uint256 skillIndex) public returns (bytes memory) {
    return execute(abi.encode(id, skillIndex));
  }
}
