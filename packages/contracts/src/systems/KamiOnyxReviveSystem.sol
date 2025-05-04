// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibData } from "libraries/LibData.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibInventory, ONYX_INDEX } from "libraries/LibInventory.sol";

uint256 constant ID = uint256(keccak256("system.kami.onyx.revive"));
uint256 constant PRICE = 3000; // 3.000

// name pet
contract KamiOnyxReviveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));
    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    // checks
    LibKami.verifyAccount(components, id, accID);
    string memory state = LibKami.getState(components, id);
    require(LibString.eq(state, "DEAD"), "kami is not dead");

    // spend onyx
    LibInventory.decFor(components, accID, ONYX_INDEX, PRICE);

    // revive
    LibKami.sync(components, id);
    LibKami.setState(components, id, "RESTING");
    LibKami.heal(components, id, 10);

    // log
    LibAccount.updateLastTs(components, accID);
    LibData.inc(components, accID, ONYX_INDEX, "TOKEN_SPEND", PRICE);

    return "";
  }

  function executeTyped(uint256 id, string memory name) public returns (bytes memory) {
    return execute(abi.encode(id, name));
  }
}
