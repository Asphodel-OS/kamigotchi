// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibCoin } from "libraries/LibCoin.sol";
import { LibKill } from "libraries/LibKill.sol";
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
    uint256 accountID = LibAccount.getByAddress(components, msg.sender);
    require(LibPet.getAccount(components, petID) == accountID, "Pet: not urs");

    // standard checks
    LibPet.syncHealth(components, petID);
    require(LibPet.isHealthy(components, petID), "Pet: starving..");
    require(LibPet.isHarvesting(components, petID), "Pet: must be harvesting");
    require(
      LibAccount.getLocation(components, accountID) == LibPet.getLocation(components, petID),
      "Pet: too far"
    );

    // check that the two kamis share the same node
    uint256 productionID = LibPet.getProduction(components, petID);
    uint256 nodeID = LibProduction.getNode(components, productionID);
    uint256 targetNodeID = LibProduction.getNode(components, targetProductionID);
    require(nodeID == targetNodeID, "Production: not on same node");

    // check that the pet is capable of liquidating the target production
    uint256 targetPetID = LibProduction.getPet(components, targetProductionID);
    LibPet.syncHealth(components, targetPetID);
    require(
      LibProduction.isLiquidatableBy(components, targetProductionID, petID),
      "Production: YOU HAVE NO POWER HERE (need moar violence)"
    );

    // collect the money
    // NOTE: this could be sent to the kami in future mechanics
    uint256 amt = LibProduction.calcBounty(components, targetProductionID);
    LibCoin.inc(components, accountID, amt);

    // kill the target and shut off the production
    LibPet.kill(components, targetPetID);
    LibProduction.stop(components, targetProductionID);
    LibKill.create(world, components, petID, targetPetID, nodeID);

    // logging and tracking
    updateScore(accountID);
    LibAccount.updateLastBlock(components, accountID);
    return "";
  }

  function executeTyped(uint256 targetProductionID, uint256 petID) public returns (bytes memory) {
    return execute(abi.encode(targetProductionID, petID));
  }

  // increments the account's LIQUIDATE score for the current epoch
  function updateScore(uint256 accountID) internal {
    uint256 epoch = LibScore.getLeaderboardEpoch(components);
    uint256 scoreID = LibScore.get(components, accountID, epoch, "LIQUIDATE");
    if (scoreID == 0) {
      scoreID = LibScore.create(world, components, accountID, epoch, "LIQUIDATE");
    }
    LibScore.inc(components, scoreID, 1);
  }
}
