// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibSkill } from "libraries/LibSkill.sol";

uint256 constant ID = uint256(keccak256("system.skill.respec"));

contract SkillRespecSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 targetID = abi.decode(arguments, (uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // verify resettable
    LibSkill.verifyResettable(components, targetID);

    // state and ownership checks
    bool isKami = LibEntityType.isShape(components, targetID, "KAMI");
    if (isKami) {
      LibKami.verifyAccount(components, targetID, accID);
    } else {
      // if not kami, check account ownership
      if (targetID != accID) revert("not ur account");
      LibKami.verifyState(components, targetID, "RESTING"); // kami must be resting
    }

    // respec skills
    LibSkill.useReset(components, targetID);
    LibSkill.resetAll(components, targetID);
    if (isKami) LibKami.sync(components, targetID);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(uint256 targetID) public returns (bytes memory) {
    return execute(abi.encode(targetID));
  }
}
