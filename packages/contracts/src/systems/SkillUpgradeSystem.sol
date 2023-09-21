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
      require(accountID == id, "SkillUpgrade: not your account");
    } else if (isPet) {
      require(accountID == LibPet.getAccount(components, id), "SkillUpgrade: pet not urs");
      require(
        LibPet.getLocation(components, id) == LibAccount.getLocation(components, accountID),
        "SkillUpgrade: must be in same room"
      );
    }

    require(
      LibSkill.checkRequirements(components, id, skillIndex),
      "SkillUpgrade: unmet requirements"
    );
    LibSkill.assignSkillFromIndex(world, components, id, skillIndex);

    LibAccount.updateLastBlock(components, accountID);
    return "";
  }

  function executeTyped(uint256 id, uint256 skillIndex) public returns (bytes memory) {
    return execute(abi.encode(id, skillIndex));
  }
}
