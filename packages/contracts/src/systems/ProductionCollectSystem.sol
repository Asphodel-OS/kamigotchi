// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibCoin } from "libraries/LibCoin.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibExperience } from "libraries/LibExperience.sol";
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
    require(accountID != 0, "ProductionCollect: no account");
    require(LibPet.getAccount(components, petID) == accountID, "Pet: not urs");
    require(LibPet.canAct(components, petID), "Pet: on cooldown");
    require(LibPet.isHarvesting(components, petID), "Pet: must be harvesting");

    // health check
    LibPet.syncHealth(components, petID);
    require(LibPet.isHealthy(components, petID), "Pet: starving..");
    require(
      LibAccount.getLocation(components, accountID) == LibPet.getLocation(components, petID),
      "Node: too far"
    );

    // add balance and experience
    uint256 output = LibProduction.calcOutput(components, id);
    LibCoin.inc(components, accountID, output);
    LibExperience.inc(components, petID, output);

    // reset production
    LibProduction.reset(components, id);

    // logging and tracking
    LibScore.incBy(world, components, accountID, "COLLECT", output);
    LibAccount.updateLastBlock(components, accountID);

    return abi.encode(output);
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
