// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibFor } from "libraries/utils/LibFor.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibSkillRegistry } from "libraries/LibSkillRegistry.sol";
import { LibSkill } from "libraries/LibSkill.sol";

uint256 constant ID = uint256(keccak256("system.Skill.Upgrade"));

// upgrade a skill
contract SkillUpgradeSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 holderID, uint32 skillIndex) = abi.decode(arguments, (uint256, uint32));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // check that the skill exists
    uint256 regID = LibSkillRegistry.getByIndex(components, skillIndex);
    require(regID != 0, "SkillUpgrade: skill not found");

    // entity type check
    /// @dev calls raw LibFor instead of LibSkill.isFor for gas savings
    // require(LibSkill.isFor(components, regID, holderID), "SkillUpgrade: invalid target");
    uint256 forEntity = LibFor.get(components, regID);
    require(LibFor.isTarget(components, holderID, forEntity), "SkillUpgrade: invalid target");

    // generic requirements
    if (LibFor.isAccount(forEntity)) {
      require(accID == holderID, "SkillUpgrade: not ur account");
    } else if (LibFor.isPet(forEntity)) {
      require(accID == LibKami.getAccount(components, holderID), "SkillUpgrade: not ur pet");
      require(LibKami.isResting(components, holderID), "SkillUpgrade: pet not resting");
      LibKami.sync(components, holderID);
    }

    // points are decremented when checking prerequisites
    require(
      LibSkill.meetsPrerequisites(components, skillIndex, holderID),
      "SkillUpgrade: unmet prerequisites"
    );

    // upgrading skill
    uint256 id = LibSkill.upgradeFor(components, skillIndex, holderID);

    // standard logging and tracking
    LibSkill.logUsePoint(components, accID);
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(uint256 holderID, uint32 skillIndex) public returns (bytes memory) {
    return execute(abi.encode(holderID, skillIndex));
  }
}
