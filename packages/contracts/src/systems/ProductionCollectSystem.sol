// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibCoin } from "libraries/LibCoin.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibProduction } from "libraries/LibProduction.sol";
import { LibScore } from "libraries/LibScore.sol";

uint256 constant ID = uint256(keccak256("system.Production.Collect"));

// ProductionCollectSystem collects on an active pet production.
contract ProductionCollectSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByAddress(components, msg.sender);
    uint256 petID = LibProduction.getPet(components, id);
    require(LibPet.getAccount(components, petID) == accountID, "Pet: not urs");

    LibPet.syncHealth(components, petID);
    require(LibPet.isHealthy(components, petID), "Pet: starving..");
    require(LibPet.isHarvesting(components, petID), "Pet: must be harvesting");
    require(
      LibAccount.getLocation(components, accountID) == LibPet.getLocation(components, petID),
      "Pet: too far"
    );

    uint256 amt = LibProduction.calcOutput(components, id);
    LibCoin.inc(components, accountID, amt);
    LibProduction.reset(components, id);

    // update score, possible finetuning to accomodate node types and affinities
    if (
      LibScore.get(components, accountID, LibScore.getLeaderboardEpoch(components), "FEED") == 0
    ) {
      LibScore.create(
        world,
        components,
        accountID,
        LibScore.getLeaderboardEpoch(components),
        "COLLECT"
      );
    }
    LibScore.incBy(world, components, accountID, "COLLECT", 1);

    LibAccount.updateLastBlock(components, accountID);
    return abi.encode(amt);
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
