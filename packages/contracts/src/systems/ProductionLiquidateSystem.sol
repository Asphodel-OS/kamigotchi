// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibData } from "libraries/LibData.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibInventory, MUSU_INDEX } from "libraries/LibInventory.sol";
import { LibKill } from "libraries/LibKill.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibHarvest } from "libraries/LibHarvest.sol";
import { LibScore } from "libraries/LibScore.sol";
import { LibRoom } from "libraries/LibRoom.sol";

uint256 constant ID = uint256(keccak256("system.Production.Liquidate"));

// liquidates a target production using a player's pet.
contract ProductionLiquidateSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 targetProductionID, uint256 kamiID) = abi.decode(arguments, (uint256, uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // standard checks (ownership, cooldown, state)
    LibKami.assertAccount(components, kamiID, accID);
    require(LibKami.isHarvesting(components, kamiID), "FarmLiquidate: pet must be harvesting");

    // basic requirements (state and idle time)
    require(!LibKami.onCooldown(components, kamiID), "FarmLiquidate: pet on cooldown");
    require(LibHarvest.isActive(components, targetProductionID), "FarmLiquidate: Harvest inactive");

    // health check
    LibKami.sync(components, kamiID);
    require(LibKami.isHealthy(components, kamiID), "FarmLiquidate: pet starving..");

    // check that the two kamis share the same node
    uint256 productionID = LibKami.getProduction(components, kamiID);
    uint256 nodeID = LibHarvest.getNode(components, productionID);
    uint256 targetNodeID = LibHarvest.getNode(components, targetProductionID);
    require(nodeID == targetNodeID, "FarmLiquidate: target too far");
    require(LibRoom.sharesRoom(components, accID, nodeID), "FarmLiquidate: node too far");

    // check that the pet is capable of liquidating the target production
    uint256 targetKamiID = LibHarvest.getPet(components, targetProductionID);
    LibKami.sync(components, targetKamiID);
    require(LibKill.isLiquidatableBy(components, targetKamiID, kamiID), "Pet: you lack violence");

    // calculate musu/experience for victim
    uint256 bounty = LibHarvest.getBalance(components, targetProductionID);
    uint256 salvage = LibKill.calcSalvage(components, targetKamiID, bounty);
    if (salvage > 0) {
      uint256 victimAccountID = LibKami.getAccount(components, targetKamiID);
      LibInventory.incFor(components, victimAccountID, MUSU_INDEX, salvage);
      LibExperience.inc(components, targetKamiID, salvage);
    }

    // calculate musu for killer
    uint256 spoils = LibKill.calcSpoils(components, kamiID, bounty - salvage);
    LibInventory.incFor(components, productionID, MUSU_INDEX, spoils);

    // calculate experience for killer
    uint256 victimLevelCost = LibExperience.calcLevelCost(components, targetKamiID);
    uint256 bonusExp = (victimLevelCost * bounty) / 2000;
    LibExperience.inc(components, kamiID, bonusExp);

    // calculate killer health
    uint256 strain = LibKami.calcStrain(components, kamiID, spoils);
    uint256 karma = LibKill.calcKarma(components, kamiID, targetKamiID);
    LibKami.drain(components, kamiID, SafeCastLib.toInt32(strain + karma));

    // kill the target and shut off the production
    LibKami.kill(components, targetKamiID);
    LibHarvest.stop(components, targetProductionID);
    LibKill.create(world, components, kamiID, targetKamiID, nodeID, bounty - salvage, spoils);
    LibKami.setLastActionTs(components, kamiID, block.timestamp);

    // standard logging and tracking
    LibScore.incFor(components, accID, "LIQUIDATE", 1);
    LibKill.logTotals(components, accID, LibNode.getIndex(components, nodeID));
    LibKill.logVictim(components, accID, LibKami.getAccount(components, targetKamiID));
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(uint256 targetProductionID, uint256 kamiID) public returns (bytes memory) {
    return execute(abi.encode(targetProductionID, kamiID));
  }
}
