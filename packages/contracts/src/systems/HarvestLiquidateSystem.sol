// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibHarvest } from "libraries/LibHarvest.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibKill, KillBalance } from "libraries/LibKill.sol";
import { LibRoom } from "libraries/LibRoom.sol";
import { LibScore } from "libraries/LibScore.sol";

uint256 constant ID = uint256(keccak256("system.harvest.liquidate"));

// liquidates a target production using a player's pet.
contract HarvestLiquidateSystem is System {
  using SafeCastLib for uint256;

  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 victimHarvID, uint256 killerID) = abi.decode(arguments, (uint256, uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // standard checks (ownership, cooldown, state)
    LibKami.assertAccount(components, killerID, accID);
    require(LibKami.isHarvesting(components, killerID), "kami must be harvesting");

    // basic requirements (state and idle time)
    require(!LibKami.onCooldown(components, killerID), "kami on cooldown");
    require(LibHarvest.isActive(components, victimHarvID), "harvest inactive");

    // health check
    LibKami.sync(components, killerID);
    require(LibKami.isHealthy(components, killerID), "kami starving..");

    // check that the two kamis share the same node
    uint256 harvID = LibKami.getProduction(components, killerID);
    uint256 nodeID = LibHarvest.getNode(components, harvID);
    require(nodeID == LibHarvest.getNode(components, victimHarvID), "target too far");
    require(LibRoom.sharesRoom(components, accID, nodeID), "node too far");

    // check that the pet is capable of liquidating the target production
    uint256 victimID = LibHarvest.getKami(components, victimHarvID);
    LibKami.sync(components, victimID);
    require(LibKill.isLiquidatableBy(components, victimID, killerID), "kami lacks violence (weak)");

    // calculate musu/experience for victim
    uint256 bounty = LibHarvest.getBalance(components, victimHarvID);
    uint256 salvage = LibKill.calcSalvage(components, victimID, bounty);
    LibKill.sendSalvage(components, victimID, salvage);

    // calculate musu for killer
    uint256 spoils = LibKill.calcSpoils(components, killerID, bounty - salvage);
    LibKill.sendSpoils(components, harvID, spoils);

    // calculate health impact on killer
    uint256 strain = LibKami.calcStrain(components, killerID, spoils);
    uint256 karma = LibKill.calcKarma(components, killerID, victimID);

    // log kill (before health changes)
    LibKill.log(
      world,
      components,
      accID,
      killerID,
      victimID,
      nodeID,
      KillBalance(bounty, salvage, spoils, strain, karma)
    );

    // drain the killer
    LibKami.drain(components, killerID, (strain + karma).toInt32());

    // kill the target and shut off the production
    LibKami.kill(components, victimID);
    LibHarvest.stop(components, victimHarvID);
    LibKami.setLastActionTs(components, killerID, block.timestamp);

    // standard logging and tracking
    LibScore.incFor(components, accID, "LIQUIDATE", 1);
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(uint256 victimHarvID, uint256 killerID) public returns (bytes memory) {
    return execute(abi.encode(victimHarvID, killerID));
  }
}
