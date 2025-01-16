// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibKami721 } from "libraries/LibKami721.sol";
import { LibSkill } from "libraries/LibSkill.sol";

uint256 constant ID = uint256(keccak256("system.kami.level"));

// level a pet up
contract KamiLevelSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // standard checks (type check, ownership, roomIndex)
    LibKami.verifyAccount(components, id, accID);
    LibKami.verifyState(components, id, "RESTING");

    // check that the pet meets the experience requirement
    uint256 levelCost = LibExperience.calcLevelCost(components, id);
    if (LibExperience.get(components, id) < levelCost) revert("PetLevel: need more experience");

    // sync pet health
    LibKami.sync(components, id);

    // consume experience, level pet up and increase its SP
    LibExperience.dec(components, id, levelCost);
    LibExperience.incLevel(components, id, 1);
    LibSkill.incPoints(components, id, 1);

    // signal a metadata update
    LibKami721.updateEvent(components, LibKami.getIndex(components, id));

    // standard logging and tracking
    LibExperience.logPetLevelInc(components, accID);
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
