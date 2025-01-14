// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibGacha } from "libraries/LibGacha.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibOnyx } from "libraries/LibOnyx.sol";

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

    // get and check price (in wei)
    uint256[] memory prevRerolls = LibGacha.extractRerollBatch(components, kamiIDs);
    LibGacha.verifyMaxRerolls(components, prevRerolls);
    LibOnyx.spend(components, LibGacha.calcRerollsCost(components, prevRerolls)); // implicit balance check

    // send pet into pool
    LibGacha.depositPets(components, kamiIDs);

    // commits random seed for gacha roll
    uint256[] memory commitIDs = LibGacha.commitBatch(
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

    // sending eth to owner
    payable(owner()).transfer(address(this).balance);

    return commitIDs;
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }
}
