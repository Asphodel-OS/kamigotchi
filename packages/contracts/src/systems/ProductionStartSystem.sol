// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibProduction } from "libraries/LibProduction.sol";

uint256 constant ID = uint256(keccak256("system.Production.Start"));

// ProductionStartSystem activates a pet production on a node. If it doesn't exist, we create one.
// We limit to one production per pet, and one production on a node per character.
// NOTE: pet is guaranteed to be healthy if resting.
// TODO: update productions to support all kinds of nodes, not just harvesting
contract ProductionStartSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 petID, uint256 nodeID) = abi.decode(arguments, (uint256, uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    // standard checks (ownership, cooldown, state)
    require(LibPet.getAccount(components, petID) == accountID, "FarmStart: pet not urs");
    require(LibPet.isResting(components, petID), "FarmStart: pet must be resting");
    require(!LibPet.onCooldown(components, petID), "FarmStart: pet on cooldown");

    // sync the pet's health and ensure the Pet is able to harvest on this Node
    LibPet.sync(components, petID);
    require(LibPet.isHealthy(components, petID), "FarmStart: pet starving..");
    require(LibAccount.sharesRoom(components, accountID, nodeID), "FarmStart: node too far");

    // start the production, create if none exists
    uint256 id = LibProduction.getForPet(components, petID);
    if (id == 0) id = LibProduction.create(components, nodeID, petID);
    else LibProduction.setNode(components, id, nodeID);
    LibProduction.start(components, id);
    LibPet.setState(components, petID, "HARVESTING");
    LibPet.setLastActionTs(components, petID, block.timestamp);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);
    return abi.encode(id);
  }

  function executeTyped(uint256 petID, uint256 nodeID) public returns (bytes memory) {
    return execute(abi.encode(petID, nodeID));
  }
}
