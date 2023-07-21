// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibCoin } from "libraries/LibCoin.sol";
import { LibKill } from "libraries/LibKill.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibProduction } from "libraries/LibProduction.sol";
import { LibScore } from "libraries/LibScore.sol";

uint256 constant ID = uint256(keccak256("system.Production.Liquidate"));

// liquidates a target production using a player's pet.
// TODO: support kill logs
contract ProductionLiquidateSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 targetProductionID, uint256 petID) = abi.decode(arguments, (uint256, uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    // standard checks (ownership, cooldown, state)
    require(LibPet.getAccount(components, petID) == accountID, "Pet: not urs");
    require(LibPet.canAct(components, petID), "Pet: on cooldown");
    require(LibPet.isHarvesting(components, petID), "Pet: must be harvesting");

    // basic requirements (state and idle time)
    require(LibProduction.isActive(components, targetProductionID), "Production: not active");

    // health check
    LibPet.syncHealth(components, petID);
    require(LibPet.isHealthy(components, petID), "Pet: starving..");

    // check that the two kamis share the same node
    uint256 productionID = LibPet.getProduction(components, petID);
    uint256 nodeID = LibProduction.getNode(components, productionID);
    uint256 targetNodeID = LibProduction.getNode(components, targetProductionID);
    require(nodeID == targetNodeID, "Production: must be on same node as target");
    require(LibAccount.sharesLocation(components, accountID, nodeID), "Node: too far");

    // check that the pet is capable of liquidating the target production
    uint256 targetPetID = LibProduction.getPet(components, targetProductionID);
    LibPet.syncHealth(components, targetPetID);
    require(
      LibProduction.isLiquidatableBy(components, targetProductionID, petID),
      "Pet: you lack violence"
    );

    // collect the money
    // NOTE: this could be sent to the kami in future mechanics
    uint256 amt = LibProduction.calcBounty(components, targetProductionID);
    LibCoin.inc(components, accountID, amt);
    LibPet.addExperience(components, petID, amt);

    // kill the target and shut off the production
    LibPet.kill(components, targetPetID);
    LibProduction.stop(components, targetProductionID);
    LibKill.create(world, components, petID, targetPetID, nodeID);

    // logging and tracking
    LibScore.incBy(world, components, accountID, "LIQUIDATE", 1);
    LibScore.incBy(world, components, accountID, "COLLECT", amt);
    LibAccount.updateLastBlock(components, accountID);
    return "";
  }

  function executeTyped(uint256 targetProductionID, uint256 petID) public returns (bytes memory) {
    return execute(abi.encode(targetProductionID, petID));
  }
}
