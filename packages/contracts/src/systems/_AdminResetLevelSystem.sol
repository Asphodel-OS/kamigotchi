// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";

import { LibExperience } from "libraries/LibExperience.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibKami721 } from "libraries/LibKami721.sol";
import { LibSkill } from "libraries/LibSkill.sol";

uint256 constant ID = uint256(keccak256("system.admin.reset.level"));

// admin system for resetting a kami's level progression (XP, level, skills)
contract _AdminResetLevelSystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyAdmin(components) returns (bytes memory) {
    uint256 kamiID = abi.decode(arguments, (uint256));
    _reset(kamiID);
    return "";
  }

  function executeBatched(uint256[] memory kamiIDs) public onlyAdmin(components) {
    for (uint256 i; i < kamiIDs.length; i++) _reset(kamiIDs[i]);
  }

  function _reset(uint256 kamiID) internal {
    require(LibEntityType.isShape(components, kamiID, "KAMI"), "not a kami");

    // sync kami state before resetting
    LibKami.sync(components, kamiID);

    // reset all skills (removes instances, bonuses, refunds SP to kami)
    LibSkill.resetAll(components, kamiID);

    // zero out XP, level, and skill points
    LibExperience.set(components, kamiID, 0);
    LibExperience.setLevel(components, kamiID, 1);
    LibSkill.setPoints(components, kamiID, 1);

    // signal metadata update for ERC721
    LibKami721.updateEvent(components, LibKami.getIndex(components, kamiID));
  }
}
