// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibFor } from "libraries/utils/LibFor.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibSkillRegistry } from "libraries/LibSkillRegistry.sol";
import { LibSkill } from "libraries/LibSkill.sol";

uint256 constant ID = uint256(keccak256("system.skill.upgrade"));

// upgrade a skill
contract SkillUpgradeSystem is System {
  using LibString for string;

  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 holderID, uint32 skillIndex) = abi.decode(arguments, (uint256, uint32));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // check that the skill exists
    uint256 regID = LibSkillRegistry.getByIndex(components, skillIndex);
    if (regID == 0) revert("SkillUpgrade: skill not found");

    // entity type check
    /// @dev calls LibFor directly to save gas
    string memory forEntity = LibFor.get(components, regID);
    if (!LibFor.isShape(components, holderID, forEntity)) revert("SkillUpgrade: invalid target");

    // generic requirements
    if (forEntity.eq("ACCOUNT")) {
      if (accID != holderID) revert("SkillUpgrade: not ur account");
    } else if (forEntity.eq("KAMI")) {
      LibKami.verifyAccount(components, holderID, accID);
      LibKami.verifyState(components, holderID, "RESTING");
      LibKami.sync(components, holderID);
    }

    // points are decremented when checking prerequisites
    LibSkill.verifyPrerequisites(components, skillIndex, holderID);

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
