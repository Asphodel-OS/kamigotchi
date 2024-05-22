// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibCoin } from "libraries/LibCoin.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibHarvest } from "libraries/LibHarvest.sol";
import { LibScore } from "libraries/LibScore.sol";

uint256 constant ID = uint256(keccak256("system.Production.Collect"));

// ProductionCollectSystem collects on an active pet production.
contract ProductionCollectSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    uint256 petID = LibHarvest.getPet(components, id);

    // standard checks (ownership, cooldown, state)
    require(LibPet.getAccount(components, petID) == accountID, "FarmCollect: pet not urs");
    require(LibPet.isHarvesting(components, petID), "FarmCollect: pet must be harvesting");
    require(!LibPet.onCooldown(components, petID), "FarmCollect: pet on cooldown");

    uint256 timeDelta = block.timestamp - LibHarvest.getLastTs(components, id);

    // health check
    LibPet.sync(components, petID);
    require(LibPet.isHealthy(components, petID), "FarmCollect: pet starving..");
    require(
      LibAccount.getRoom(components, accountID) == LibPet.getRoom(components, petID),
      "FarmCollect: node too far"
    );

    // process collection
    uint256 output = LibHarvest.claim(components, id);
    LibExperience.inc(components, petID, output);
    LibPet.setLastActionTs(components, petID, block.timestamp);

    // standard logging and tracking
    uint256 nodeID = LibHarvest.getNode(components, id);
    LibScore.inc(components, accountID, "COLLECT", output);
    LibDataEntity.inc(components, accountID, 0, "COIN_TOTAL", output);
    LibNode.logHarvestAt(components, accountID, LibNode.getIndex(components, nodeID), output);
    LibNode.logHarvestAffinity(
      components,
      accountID,
      LibNode.getAffinity(components, nodeID),
      output
    );
    LibHarvest.logHarvestTime(components, accountID, timeDelta);
    LibAccount.updateLastTs(components, accountID);

    return abi.encode(output);
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
