// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibProduction } from "libraries/LibProduction.sol";

uint256 constant ID = uint256(keccak256("system.Production.Start"));

// ProductionStartSystem activates a pet production on a node. If it doesn't exist, we create one.
// We limit to one production per pet, and one production on a node per character.
// NOTE: no isHealthy() check here as the pet must be healthy if resting.
contract ProductionStartSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 petID, uint256 nodeID) = abi.decode(arguments, (uint256, uint256));
    uint256 accountID = LibAccount.getByAddress(components, msg.sender);
    require(LibPet.getAccount(components, petID) == accountID, "Pet: not urs");

    // sync the pet's health with the current state
    LibPet.syncHealth(components, petID);

    // ensure the pet is resting and the node is close enough
    require(LibPet.isResting(components, petID), "Pet: must be resting");
    require(LibAccount.sharesLocation(components, accountID, nodeID), "Node: too far");

    // start the production, create if none exists
    uint256 id = LibProduction.getForPet(components, petID);
    if (id == 0) id = LibProduction.create(world, components, nodeID, petID);
    else LibProduction.setNode(components, id, nodeID);
    LibProduction.start(components, id);

    // update the pet's state and account's last block
    LibPet.setState(components, petID, "HARVESTING");
    LibAccount.updateLastBlock(components, accountID);
    return abi.encode(id);
  }

  function executeTyped(uint256 petID, uint256 nodeID) public returns (bytes memory) {
    return execute(abi.encode(petID, nodeID));
  }
}
