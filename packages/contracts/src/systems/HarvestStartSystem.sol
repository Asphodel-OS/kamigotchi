// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibHarvest } from "libraries/LibHarvest.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibRoom } from "libraries/LibRoom.sol";

uint256 constant ID = uint256(keccak256("system.harvest.start"));

// HarvestStartSystem activates a pet harvest on a node. If it doesn't exist, we create one.
// We limit to one harvest per pet, and one harvest on a node per character.
// NOTE: pet is guaranteed to be healthy if resting.
// TODO: update harvests to support all kinds of nodes, not just harvesting
contract HarvestStartSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 kamiID, uint256 nodeID) = abi.decode(arguments, (uint256, uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // standard checks (ownership, cooldown, state)
    LibKami.verifyAccount(components, kamiID, accID);
    LibKami.verifyState(components, kamiID, "RESTING");
    LibKami.verifyCooldown(components, kamiID);

    // sync the pet's health and ensure the Pet is able to harvest on this Node
    LibKami.sync(components, kamiID);
    LibKami.verifyHealthy(components, kamiID);
    LibRoom.verifySharedRoom(components, accID, nodeID);

    // check node requirements (if any)
    uint32 nodeIndex = LibNode.getIndex(components, nodeID);
    LibNode.verifyRequirements(components, nodeIndex, accID, kamiID);

    // start the harvest, create if none exists
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
