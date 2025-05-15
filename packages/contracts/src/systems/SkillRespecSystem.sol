// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibSkill } from "libraries/LibSkill.sol";

uint256 constant ID = uint256(keccak256("system.skill.respec"));

uint32 constant RESPEC_POTION_INDEX = 11403;

contract SkillRespecSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 targetID = abi.decode(arguments, (uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // LibSkill.verifyResettable(components, targetID);
    // state and ownership checks
    string memory targetShape = LibEntityType.get(components, targetID);
    bool isKami = LibString.eq(targetShape, "KAMI");
    if (isKami) {
      LibKami.verifyAccount(components, targetID, accID);
    } else {
      // if not kami, check account ownership
      if (targetID != accID) revert("not ur account");
      LibKami.verifyState(components, targetID, "RESTING"); // kami must be resting
    }

    // use respec potion
    LibInventory.decFor(components, accID, RESPEC_POTION_INDEX, 1);
    LibItem.applyAllos(world, components, RESPEC_POTION_INDEX, "USE", 1, targetID); // may change from USE to RESPEC in future

    // respec skills
    // LibSkill.useReset(components, targetID);
    LibSkill.resetAll(components, targetID);
    if (isKami) LibKami.sync(components, targetID);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    LibItem.logUse(components, accID, RESPEC_POTION_INDEX, 1, targetShape);

    return "";
  }

  function executeTyped(uint256 targetID) public returns (bytes memory) {
    return execute(abi.encode(targetID));
  }
}
