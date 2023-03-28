// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibCoin } from "libraries/LibCoin.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibProduction } from "libraries/LibProduction.sol";

uint256 constant ID = uint256(keccak256("system.Production.Liquidate"));

// ProductionLiquidateSystem collects on an active pet production.
// TODO: update this to kill the pet off if health is at 0
contract ProductionLiquidateSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 petID, uint256 targetProductionID) = abi.decode(arguments, (uint256, uint256));
    uint256 accountID = LibAccount.getByAddress(components, msg.sender);

    // standard checks
    require(LibPet.isAccount(components, petID, accountID), "Pet: not urs");
    require(LibPet.syncHealth(components, petID) != 0, "Pet: is dead (pls revive)");
    require(LibProduction.isActive(components, targetProductionID), "Production: not active");

    // check that the target production is active
    uint256 productionID = LibPet.getProduction(components, petID);
    require(LibProduction.isActive(components, productionID), "Pet: must be harvesting");

    // check that the two kamis share the same node
    uint256 nodeID = LibProduction.getNode(components, productionID);
    uint256 targetNodeID = LibProduction.getNode(components, targetProductionID);
    require(nodeID == targetNodeID, "Production: not on same node");

    // check that the pet is capable of to liquidating the target production
    require(
      LibProduction.isLiquidatableBy(components, targetProductionID, petID),
      "Production: YOU HAVE NO POWER HERE (need moar violence)"
    );

    uint256 targetPetID = LibProduction.getPet(components, targetProductionID);

    // collect the money
    // NOTE: this could be sent to the kami in future mechanics
    uint256 amt = LibProduction.calcBounty(components, targetProductionID);
    LibCoin.inc(components, accountID, amt);

    // kill the target and shut off the production
    LibPet.kill(components, targetPetID);
    LibProduction.stop(components, targetProductionID);

    LibAccount.updateLastBlock(components, accountID);
    return abi.encode(amt);
  }

  function executeTyped(uint256 petID, uint256 targetProductionID) public returns (bytes memory) {
    return execute(abi.encode(petID, targetProductionID));
  }
}
