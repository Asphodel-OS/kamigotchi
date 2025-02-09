// SPDX-License-Identifier: Unlicense
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

uint256 constant ID = uint256(keccak256("system.harvest.stop"));

// HarvestStopSystem collects and stops an active pet harvest. This is the case
// when a pet is stopped by the owner. When it is stopped by liquidation or death, the
// output is not collected.
// TODO: update harvests to support all kinds of nodes, not just harvesting
contract HarvestStopSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);
    uint256 kamiID = LibHarvest.getKami(components, id);

    // standard checks (ownership, cooldown, state)
    LibKami.verifyAccount(components, kamiID, accID);
    LibKami.verifyState(components, kamiID, "HARVESTING");
    LibKami.verifyCooldown(components, kamiID);

    // health check
    LibKami.sync(components, kamiID);
    LibKami.verifyHealthy(components, kamiID);

    // roomIndex check
    LibKami.verifyRoom(components, kamiID, accID);

    // process collection and harvest stop
    uint256 output = LibHarvest.claim(components, id, accID);
    LibHarvest.stop(components, id);
    LibKami.setState(components, kamiID, "RESTING");
    LibExperience.inc(components, kamiID, output);
    LibKami.setLastActionTs(components, kamiID, block.timestamp);

    // scavenge
    uint256 nodeID = LibHarvest.getNode(components, id);
    uint32 nodeIndex = LibNode.getIndex(components, nodeID);
    LibNode.scavenge(components, nodeIndex, output, accID); // implicit existance check

    // reset action bonuses
    LibBonus.resetUponHarvestAction(components, kamiID);

    // standard logging and tracking
    LibScore.incFor(components, accID, "COLLECT", output);
    LibInventory.logItemTotal(components, accID, MUSU_INDEX, output);
    LibHarvest.logHarvestTimes(components, accID, nodeIndex, id); // log time only on stop
    LibHarvest.logAmounts(
      components,
      accID,
      nodeIndex,
      LibNode.getAffinity(components, nodeID),
      MUSU_INDEX,
      output
    );
    LibHarvest.logStop(world, accID, kamiID, nodeIndex, output);
    LibAccount.updateLastTs(components, accID);

    return abi.encode(output);
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
