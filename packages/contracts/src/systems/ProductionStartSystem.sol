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
// TODO: update this to kill the pet off if health is at 0
contract ProductionStartSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 petID, uint256 nodeID) = abi.decode(arguments, (uint256, uint256));
    uint256 accountID = LibAccount.getByAddress(components, msg.sender);

    require(LibPet.isAccount(components, petID, accountID), "Pet: not urs");
    require(!LibPet.isProducing(components, petID), "Pet: already producing");
    require(LibPet.syncHealth(components, petID) != 0, "Pet: is dead (pls revive)");

    uint256 id = LibProduction.getForPet(components, petID);
    if (id == 0) {
      id = LibProduction.create(world, components, nodeID, petID);
    } else {
      LibProduction.setNode(components, id, nodeID);
      LibProduction.start(components, id);
    }

    LibAccount.updateLastBlock(components, accountID);
    return abi.encode(id);
  }

  function executeTyped(uint256 petID, uint256 nodeID) public returns (bytes memory) {
    return execute(abi.encode(petID, nodeID));
  }
}
