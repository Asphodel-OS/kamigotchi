// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibData } from "libraries/LibData.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibInventory, MUSU_INDEX } from "libraries/LibInventory.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibHarvest } from "libraries/LibHarvest.sol";
import { LibScore } from "libraries/LibScore.sol";

uint256 constant ID = uint256(keccak256("system.Production.Collect"));

// ProductionCollectSystem collects on an active pet production.
contract ProductionCollectSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);
    uint256 kamiID = LibHarvest.getPet(components, id);

    // standard checks (ownership, cooldown, state)
    LibKami.assertAccount(components, kamiID, accID);
    require(LibKami.isHarvesting(components, kamiID), "FarmCollect: pet must be harvesting");
    require(!LibKami.onCooldown(components, kamiID), "FarmCollect: pet on cooldown");

    // health check
    LibKami.sync(components, kamiID);
    require(LibKami.isHealthy(components, kamiID), "FarmCollect: pet starving..");
    LibKami.assertRoom(components, kamiID, accID);

    // process collection
    uint256 output = LibHarvest.claim(components, id);
    LibExperience.inc(components, kamiID, output);
    LibKami.setLastActionTs(components, kamiID, block.timestamp);

    // scavenge
    uint256 nodeID = LibHarvest.getNode(components, id);
    uint32 nodeIndex = LibNode.getIndex(components, nodeID);
    LibNode.scavenge(components, nodeIndex, output, accID); // implicit existance check

    // standard logging and tracking
    LibScore.incFor(components, accID, "COLLECT", output);
    LibInventory.logItemTotal(components, accID, MUSU_INDEX, output);
    LibHarvest.logAmounts(
      components,
      accID,
      nodeIndex,
      LibNode.getAffinity(components, nodeID),
      MUSU_INDEX,
      output
    );
    LibAccount.updateLastTs(components, accID);

    return abi.encode(output);
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
