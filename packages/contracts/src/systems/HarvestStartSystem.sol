// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibHarvest } from "libraries/LibHarvest.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibRoom } from "libraries/LibRoom.sol";

uint256 constant ID = uint256(keccak256("system.harvest.start"));

// HarvestStartSystem activates a pet harvest on a node. If it doesn't exist, we create one.
// We limit to one harvest per pet, and one harvest on a node per character.
// NOTE: pet is guaranteed to be healthy if resting.
// TODO: update harvests to support all kinds of nodes, not just harvesting
contract HarvestStartSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 kamiID, uint32 nodeIndex, uint256 taxerID, uint256 taxAmt) = abi.decode(
      arguments,
      (uint256, uint32, uint256, uint256)
    );
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    uint256 nodeID = LibNode.getByIndex(components, nodeIndex);
    if (nodeID == 0) revert("node does not exist");

    // standard checks (ownership, cooldown, state)
    LibKami.verifyAccount(components, kamiID, accID);
    LibKami.verifyState(components, kamiID, "RESTING");
    LibKami.verifyCooldown(components, kamiID);

    // sync the pet's health
    LibKami.sync(components, kamiID); // sync pre-node bonus to process off-harvest data

    // checks
    LibKami.verifyHealthy(components, kamiID);
    LibRoom.verifySharedRoom(components, accID, nodeID);
    LibNode.verifyRequirements(components, nodeIndex, kamiID);

    // assign node bonuses
    LibNode.assignBonuses(components, nodeIndex, kamiID);
    LibKami.sync(components, kamiID); // process bonuses

    // start the harvest, create if none exists
    uint256 id = LibHarvest.startFor(components, nodeID, kamiID, taxerID, taxAmt);
    LibKami.setState(components, kamiID, "HARVESTING");
    LibKami.resetCooldown(components, kamiID);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    return abi.encode(id);
  }

  function executeTyped(
    uint256 kamiID,
    uint32 nodeIndex,
    uint256 taxerID,
    uint256 taxAmt
  ) public returns (bytes memory) {
    return execute(abi.encode(kamiID, nodeIndex, taxerID, taxAmt));
  }

  // naive batched execution - todo: optimize
  function executeBatched(
    uint256[] memory kamiIDs,
    uint32 nodeIndex,
    uint256 taxerID,
    uint256 taxAmt
  ) public returns (bytes[] memory) {
    bytes[] memory results = new bytes[](kamiIDs.length);
    for (uint256 i; i < kamiIDs.length; i++)
      results[i] = executeTyped(kamiIDs[i], nodeIndex, taxerID, taxAmt);
    return results;
  }
}
