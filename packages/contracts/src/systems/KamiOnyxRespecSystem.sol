// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibData } from "libraries/LibData.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibSkill } from "libraries/LibSkill.sol";
import { LibInventory, ONYX_INDEX } from "libraries/LibInventory.sol";

uint256 constant ID = uint256(keccak256("system.kami.onyx.respec"));
uint256 constant PRICE = 10000; // 10.000

/// @dev skips skill respec flag
contract KamiOnyxRespecSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));
    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    // checks
    LibKami.verifyAccount(components, id, accID);
    LibKami.verifyState(components, id, "RESTING");

    // spend onyx
    LibInventory.decFor(components, accID, ONYX_INDEX, PRICE);

    // respec
    LibSkill.resetAll(components, id);
    LibKami.sync(components, id);

    // log
    LibAccount.updateLastTs(components, accID);
    LibData.inc(components, accID, ONYX_INDEX, "TOKEN_SPEND", PRICE);
    LibData.inc(components, 0, ONYX_INDEX, "TOKEN_SPEND", PRICE);
    LibData.inc(components, 0, ONYX_INDEX, "TOKEN_SPEND_RESPEC", PRICE);

    return "";
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
