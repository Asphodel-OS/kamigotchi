// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibCoin } from "libraries/LibCoin.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibProduction } from "libraries/LibProduction.sol";
import { LibScore } from "libraries/LibScore.sol";

uint256 constant ID = uint256(keccak256("system.Production.Collect"));

// ProductionCollectSystem collects on an active pet production.
contract ProductionCollectSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    uint256 petID = LibProduction.getPet(components, id);

    // standard checks (ownership, cooldown, state)
    require(accountID != 0, "FarmCollect: no account");
    require(LibPet.getAccount(components, petID) == accountID, "FarmCollect: pet not urs");
    require(LibPet.isHarvesting(components, petID), "FarmCollect: pet must be harvesting");
    require(!LibPet.onCooldown(components, petID), "FarmCollect: pet on cooldown");

    // health check
    LibPet.sync(components, petID);
    require(LibPet.isHealthy(components, petID), "FarmCollect: pet starving..");
    require(
      LibAccount.getRoom(components, accountID) == LibPet.getRoom(components, petID),
      "FarmCollect: node too far"
    );

    // claim balance and increase experience
    uint256 output = LibProduction.claim(components, id);
    LibExperience.inc(components, petID, output);

    // Update ts for Standard Action Cooldowns
    LibPet.setLastActionTs(components, petID, block.timestamp);

    // standard logging and tracking
    LibScore.incBy(world, components, accountID, "COLLECT", output);
    LibDataEntity.incFor(world, components, accountID, 0, "COIN_TOTAL", output);
    LibDataEntity.incFor(
      world,
      components,
      accountID,
      LibNode.getIndex(components, LibProduction.getNode(components, id)),
      "NODE_COLLECT",
      output
    );
    LibAccount.updateLastTs(components, accountID);

    return abi.encode(output);
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
