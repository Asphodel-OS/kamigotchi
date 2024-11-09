// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibGacha } from "libraries/LibGacha.sol";
import { LibKami } from "libraries/LibKami.sol";

uint256 constant ID = uint256(keccak256("system.kami.gacha.reroll"));

/// @notice commits to get a random pet from gacha via rerolling + cost
/// @dev only meant to be called for a single account
contract KamiGachaRerollSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function reroll(uint256[] memory kamiIDs) external payable returns (uint256[] memory) {
    uint256 accID = LibAccount.getByOwner(components, msg.sender);
    require(accID != 0, "no account detected");
    LibKami.assertAccount(components, kamiIDs, accID);
    require(LibKami.isResting(components, kamiIDs), "not resting");

    // get and check price (in wei)
    uint256[] memory prevRerolls = LibGacha.extractRerollBatch(components, kamiIDs);
    LibGacha.onlyNotMaxRerolls(components, prevRerolls);
    if (msg.value < LibGacha.calcRerollsCost(components, prevRerolls)) revert("not enough payment");

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
    LibAccount.logIncKamisRerolled(world, components, accID, kamiIDs.length);
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
