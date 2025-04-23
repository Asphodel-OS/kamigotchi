// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibGacha } from "libraries/LibGacha.sol";
import { LibInventory, REROLL_TICKET_INDEX } from "libraries/LibInventory.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibERC20 } from "libraries/LibERC20.sol";
import { LibInventory, REROLL_TICKET_INDEX } from "libraries/LibInventory.sol";

uint256 constant ID = uint256(keccak256("system.kami.gacha.reroll"));

/// @notice commits to get a random pet from gacha via rerolling + cost
/// @dev only meant to be called for a single account
contract KamiGachaRerollSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function reroll(uint256[] memory kamiIDs) external returns (uint256[] memory) {
    uint256 accID = LibAccount.getByOwner(components, msg.sender);
    require(accID != 0, "no account detected");
    LibKami.verifyAccount(components, kamiIDs, accID);
    LibKami.verifyState(components, kamiIDs, "RESTING");

    // get previous data
    uint256[] memory prevRerolls = LibGacha.extractRerollBatch(components, kamiIDs);

    // spend reroll tickets and send selected pets to pool
    LibInventory.decFor(components, accID, REROLL_TICKET_INDEX, kamiIDs.length);
    LibGacha.depositPets(components, kamiIDs);

    // commits random seed for gacha roll
    uint256[] memory commitIDs = LibGacha.commit(
      world,
      components,
      kamiIDs.length,
      accID,
      block.number
    );
    LibGacha.setRerollBatch(components, commitIDs, prevRerolls);

    // standard logging and tracking
    LibGacha.logReroll(components, accID, kamiIDs.length);
    LibAccount.updateLastTs(components, accID);

    return commitIDs;
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }
}
