// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibCoin } from "libraries/LibCoin.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibProduction } from "libraries/LibProduction.sol";
import { LibScore } from "libraries/LibScore.sol";

uint256 constant ID = uint256(keccak256("system.Node.Collect"));

// NodeCollectSystem collects from all eligible productions on a node.
// NOTE: may need to restrict this by HARVEST nodes in the future
contract NodeCollectSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 nodeID = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    require(
      LibAccount.getLocation(components, accountID) == LibNode.getLocation(components, nodeID),
      "Node: too far"
    );

    // scan the list of productions of pets owned by the account
    uint256 petID;
    uint256 productionID;
    uint256 output;
    uint256 totalOutput;
    uint256[] memory petIDs = LibPet.getAllForAccount(components, accountID);
    for (uint256 i = 0; i < petIDs.length; i++) {
      petID = petIDs[i];
      if (!LibPet.isHarvesting(components, petID)) continue;

      productionID = LibPet.getProduction(components, petID);
      if (LibProduction.getNode(components, productionID) != nodeID) continue;

      LibPet.syncHealth(components, petID);
      if (!LibPet.isHealthy(components, petID)) continue;

      output = LibProduction.calcOutput(components, productionID);
      LibPet.addExperience(components, petID, output);
      LibProduction.reset(components, productionID);
      totalOutput += output;
    }

    // balance updates, score logging, action tracking
    LibCoin.inc(components, accountID, totalOutput);
    LibScore.incBy(world, components, accountID, "COLLECT", totalOutput);
    LibAccount.updateLastBlock(components, accountID);
    return abi.encode(totalOutput);
  }

  function executeTyped(uint256 nodeID) public returns (bytes memory) {
    return execute(abi.encode(nodeID));
  }
}
