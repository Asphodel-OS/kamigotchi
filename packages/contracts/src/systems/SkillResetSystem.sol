// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibSkill } from "libraries/LibSkill.sol";

uint256 constant ID = uint256(keccak256("system.skill.reset"));

// testnet world 1.5 system, to be removed
contract SkillResetSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 holderID = abi.decode(arguments, (uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    LibKami.assertAccount(components, holderID, accID);
    require(LibKami.isResting(components, holderID), "SkillUpgrade: pet not resting");
    LibKami.sync(components, holderID);

    LibSkill.resetAll(components, holderID);

    LibKami.sync(components, holderID);

    return "";
  }

  function executeTyped(uint256 holderID) public returns (bytes memory) {
    return execute(abi.encode(holderID));
  }
}
