// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibInventory, MUSU_INDEX } from "libraries/LibInventory.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibHarvest } from "libraries/LibHarvest.sol";
import { LibScore } from "libraries/LibScore.sol";

uint256 constant ID = uint256(keccak256("system.harvest.collect"));

// HarvestCollectSystem collects on an active pet harvest.
contract HarvestCollectSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);
    uint256 kamiID = LibHarvest.getKami(components, id);

    // standard checks (ownership, cooldown, state)
    LibHarvest.verifyIsHarvest(components, id);
    LibKami.verifyAccount(components, kamiID, accID);
    LibKami.verifyState(components, kamiID, "HARVESTING");
    LibKami.verifyCooldown(components, kamiID);

    // health check
    LibKami.sync(components, kamiID);
    LibKami.verifyHealthy(components, kamiID);
    LibKami.verifyRoom(components, kamiID, accID);

    // process collection
    uint256 output = LibHarvest.claim(components, id, accID);
    LibExperience.inc(components, kamiID, output);
    LibKami.setLastActionTs(components, kamiID, block.timestamp);

    // scavenge
    uint256 nodeID = LibHarvest.getNode(components, id);
    uint32 nodeIndex = LibNode.getIndex(components, nodeID);
    LibNode.scavenge(components, nodeIndex, output, accID); // implicit existance check

    // reset action bonuses
    LibBonus.resetUponHarvestAction(components, kamiID);

    // standard logging and tracking
    LibScore.incFor(components, accID, MUSU_INDEX, "COLLECT", output);
    LibHarvest.logAmounts(
      components,
      accID,
      nodeIndex,
      LibNode.getAffinity(components, nodeID),
      MUSU_INDEX,
      output
    );
    LibHarvest.emitLog(world, "HARVEST_COLLECT", accID, kamiID, nodeIndex, output);
    LibAccount.updateLastTs(components, accID);

    return abi.encode(output);
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }

  // naive batched execution - todo: optimize
  function executeBatched(uint256[] memory ids) public returns (bytes[] memory) {
    bytes[] memory results = new bytes[](ids.length);
    for (uint256 i; i < ids.length; i++) results[i] = execute(abi.encode(ids[i]));
    return results;
  }
}
