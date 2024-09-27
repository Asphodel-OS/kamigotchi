// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibHarvest } from "libraries/LibHarvest.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibRoom } from "libraries/LibRoom.sol";

uint256 constant ID = uint256(keccak256("system.Production.Start"));

// ProductionStartSystem activates a pet production on a node. If it doesn't exist, we create one.
// We limit to one production per pet, and one production on a node per character.
// NOTE: pet is guaranteed to be healthy if resting.
// TODO: update productions to support all kinds of nodes, not just harvesting
contract ProductionStartSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 kamiID, uint256 nodeID) = abi.decode(arguments, (uint256, uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // standard checks (ownership, cooldown, state)
    LibKami.assertAccount(components, kamiID, accID);
    require(LibKami.isResting(components, kamiID), "FarmStart: pet must be resting");
    require(!LibKami.onCooldown(components, kamiID), "FarmStart: pet on cooldown");

    // sync the pet's health and ensure the Pet is able to harvest on this Node
    LibKami.sync(components, kamiID);
    require(LibKami.isHealthy(components, kamiID), "FarmStart: pet starving..");
    require(LibRoom.sharesRoom(components, accID, nodeID), "FarmStart: node too far");

    // check node requirements (if any)
    uint32 nodeIndex = LibNode.getIndex(components, nodeID);
    require(
      LibNode.checkReqs(components, nodeIndex, accID, kamiID),
      "FarmStart: node reqs not met"
    );

    // start the production, create if none exists
    uint256 id = LibHarvest.getForKami(components, kamiID);
    if (id == 0) id = LibHarvest.create(components, nodeID, kamiID);
    else LibHarvest.setNode(components, id, nodeID);
    LibHarvest.start(components, id);
    LibKami.setState(components, kamiID, "HARVESTING");
    LibKami.setLastActionTs(components, kamiID, block.timestamp);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    return abi.encode(id);
  }

  function executeTyped(uint256 kamiID, uint256 nodeID) public returns (bytes memory) {
    return execute(abi.encode(kamiID, nodeID));
  }
}
