// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibData } from "libraries/LibData.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibInventory, MUSU_INDEX } from "libraries/LibInventory.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibHarvest } from "libraries/LibHarvest.sol";
import { LibScore } from "libraries/LibScore.sol";

uint256 constant ID = uint256(keccak256("system.Production.Stop"));

// ProductionStopSystem collects and stops an active pet production. This is the case
// when a pet is stopped by the owner. When it is stopped by liquidation or death, the
// output is not collected.
// TODO: update productions to support all kinds of nodes, not just harvesting
contract ProductionStopSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);
    uint256 petID = LibHarvest.getPet(components, id);

    // standard checks (ownership, cooldown, state)
    require(LibPet.getAccount(components, petID) == accID, "FarmStop: pet not urs");
    require(LibPet.isHarvesting(components, petID), "FarmStop: pet must be harvesting");
    require(!LibPet.onCooldown(components, petID), "FarmStop: pet on cooldown");

    // health check
    LibPet.sync(components, petID);
    require(LibPet.isHealthy(components, petID), "FarmStop: pet starving..");

    // roomIndex check
    require(
      LibAccount.getRoom(components, accID) == LibPet.getRoom(components, petID),
      "FarmStop: node too far"
    );

    // claim balance and increase experience
    uint256 output = LibHarvest.claim(components, id);
    LibExperience.inc(components, petID, output);

    // process harvest stop
    LibHarvest.stop(components, id);
    LibPet.setState(components, petID, "RESTING");
    LibPet.setLastActionTs(components, petID, block.timestamp);

    // standard logging and tracking
    uint256 nodeID = LibHarvest.getNode(components, id);
    LibScore.incFor(components, accID, "COLLECT", output);
    LibInventory.logIncItemTotal(components, accID, MUSU_INDEX, output);
    LibNode.logHarvestAt(components, accID, LibNode.getIndex(components, nodeID), output);
    LibNode.logHarvestAffinity(components, accID, LibNode.getAffinity(components, nodeID), output);
    LibAccount.updateLastTs(components, accID);

    return abi.encode(output);
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
