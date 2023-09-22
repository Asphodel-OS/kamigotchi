// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibSkill } from "libraries/LibSkill.sol";

uint256 constant ID = uint256(keccak256("system.Skill.Upgrade"));

// upgrade a skill
contract SkillUpgradeSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 id, uint256 skillIndex) = abi.decode(arguments, (uint256, uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    bool isPet = LibPet.isPet(components, id);
    bool isAccount = LibAccount.isAccount(components, id);
    require(isPet || isAccount, "SkillUpgrade: invalid target");

    if (isAccount) {
      require(accountID == id, "SkillUpgrade: not ur account");
    } else if (isPet) {
      require(accountID == LibPet.getAccount(components, id), "SkillUpgrade: not ur pet");
      require(
        LibPet.getLocation(components, id) == LibAccount.getLocation(components, accountID),
        "SkillUpgrade: must be in same room"
      );
    }

    // points are decremented when checking prerequisites
    require(
      LibSkill.checkPrerequisites(components, id, skillIndex),
      "SkillUpgrade: unmet prerequisites"
    );

    // create the skill if it doesnt exist
    uint256 skillID = LibSkill.get(components, id, skillIndex);
    if (skillID == 0) skillID = LibSkill.create(world, components, id, skillIndex);

    // increment points on skill
    LibSkill.inc(components, skillID, 1);

    LibAccount.updateLastBlock(components, accountID);
    return "";
  }

  function executeTyped(uint256 id, uint256 skillIndex) public returns (bytes memory) {
    return execute(abi.encode(id, skillIndex));
  }
}
