// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibSkill } from "libraries/LibSkill.sol";

uint256 constant ID = uint256(keccak256("system.Skill.Select"));

// level a pet up
contract SkillSelectSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 id, uint256 skillIndex) = abi.decode(arguments, (uint256, uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    if (LibAccount.isAccount(components, id)) {
      require(accountID == id, "SkillSelect: acc not urs");
    } else if (LibPet.isPet(components, id)) {
      require(accountID == LibPet.getAccount(components, id), "SkillSelect: pet not urs");
      require(
        LibPet.getLocation(components, id) == LibAccount.getLocation(components, accountID),
        "PetLevel: must be in same room"
      );
    } else {
      require(false, "SkillSelect: not an account or pet");
    }

    require(LibSkill.checkRequirements(components, id, skillIndex), "SkillSelect: req not met");
    LibSkill.assignSkillFromIndex(world, components, id, skillIndex);

    LibAccount.updateLastBlock(components, accountID);
    return "";
  }

  function executeTyped(uint256 id, uint256 skillIndex) public returns (bytes memory) {
    return execute(abi.encode(id, skillIndex));
  }
}
