// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibCoin } from "libraries/LibCoin.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
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
    require(accountID != 0, "FarmLiquidate: no account");
    require(LibPet.getAccount(components, petID) == accountID, "FarmLiquidate: pet not urs");
    require(LibPet.isHarvesting(components, petID), "FarmLiquidate: pet must be harvesting");

    // basic requirements (state and idle time)
    require(!LibPet.onCooldown(components, petID), "FarmLiquidate: pet on cooldown");
    require(
      LibProduction.isActive(components, targetProductionID),
      "FarmLiquidate: Harvest inactive"
    );

    // health check
    LibPet.sync(components, petID);
    require(LibPet.isHealthy(components, petID), "FarmLiquidate: pet starving..");

    // check that the two kamis share the same node
    uint256 productionID = LibPet.getProduction(components, petID);
    uint256 nodeID = LibProduction.getNode(components, productionID);
    uint256 targetNodeID = LibProduction.getNode(components, targetProductionID);
    require(nodeID == targetNodeID, "FarmLiquidate: target too far");
    require(
      LibAccount.sharesLocation(components, accountID, nodeID),
      "FarmLiquidate: node too far"
    );

    // check that the pet is capable of liquidating the target production
    uint256 targetPetID = LibProduction.getPet(components, targetProductionID);
    LibPet.sync(components, targetPetID);
    require(
      LibProduction.isLiquidatableBy(components, targetPetID, petID),
      "Pet: you lack violence"
    );

    // collect the money to the production. drain accordingly
    uint256 balance = LibProduction.getBalance(components, targetProductionID);
    uint256 bounty = LibPet.calcBounty(components, petID, balance);
    uint256 recoil = LibPet.calcDrain(components, petID, bounty);
    LibCoin.inc(components, productionID, bounty);
    LibPet.drain(components, petID, recoil);

    // kill the target and shut off the production
    LibPet.kill(components, targetPetID);
    LibProduction.stop(components, targetProductionID);
    LibKill.create(world, components, petID, targetPetID, nodeID, balance, bounty);

    // Update ts for Standard Action Cooldowns
    uint256 standardActionTs = block.timestamp;
    uint256 bonusID = LibBonus.get(components, petID, "ATTACK_COOLDOWN");
    if (bonusID != 0) standardActionTs -= LibBonus.getValue(components, bonusID);
    LibPet.setLastActionTs(components, petID, standardActionTs);

    // standard logging and tracking
    LibScore.incBy(world, components, accountID, "LIQUIDATE", 1);
    LibDataEntity.incFor(world, components, accountID, 0, "LIQUIDATE", 1);
    LibDataEntity.incFor(
      world,
      components,
      accountID,
      LibNode.getIndex(components, nodeID),
      "NODE_LIQUIDATE",
      1
    );
    LibDataEntity.incFor(
      world,
      components,
      LibPet.getAccount(components, targetPetID),
      0,
      "BEEN_LIQUIDATEED",
      1
    );
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(uint256 targetProductionID, uint256 petID) public returns (bytes memory) {
    return execute(abi.encode(targetProductionID, petID));
  }
}
