// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";

import { Stat, StatLib } from "components/types/Stat.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibData } from "libraries/LibData.sol";
import { LibInventory, MUSU_INDEX } from "libraries/LibInventory.sol";
import { LibKill } from "libraries/LibKill.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibHarvest } from "libraries/LibHarvest.sol";
import { LibScore } from "libraries/LibScore.sol";
import { LibStat } from "libraries/LibStat.sol";

uint256 constant ID = uint256(keccak256("system.Production.Liquidate"));

// liquidates a target production using a player's pet.
contract ProductionLiquidateSystem is System {
  using SafeCastLib for uint256;

  event KamiLiquidated(
    uint32 indexed sourceIndex,
    int32 sourceHealth,
    int32 sourceHealthTotal,
    uint32 indexed targetIndex,
    int32 targetHealth,
    int32 targetHealthTotal,
    uint32 bounty,
    uint32 salvage,
    uint32 spoils,
    uint32 strain,
    uint32 karma,
    uint64 endTs
  );

  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 targetProductionID, uint256 petID) = abi.decode(arguments, (uint256, uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // standard checks (ownership, cooldown, state)
    require(LibPet.getAccount(components, petID) == accID, "FarmLiquidate: pet not urs");
    require(LibPet.isHarvesting(components, petID), "FarmLiquidate: pet must be harvesting");

    // basic requirements (state and idle time)
    require(!LibPet.onCooldown(components, petID), "FarmLiquidate: pet on cooldown");
    require(LibHarvest.isActive(components, targetProductionID), "FarmLiquidate: Harvest inactive");

    // health check
    LibPet.sync(components, petID);
    require(LibPet.isHealthy(components, petID), "FarmLiquidate: pet starving..");

    // check that the two kamis share the same node
    uint256 productionID = LibPet.getProduction(components, petID);
    uint256 nodeID = LibHarvest.getNode(components, productionID);
    uint256 targetNodeID = LibHarvest.getNode(components, targetProductionID);
    require(nodeID == targetNodeID, "FarmLiquidate: target too far");
    require(LibAccount.sharesRoom(components, accID, nodeID), "FarmLiquidate: node too far");

    // check that the pet is capable of liquidating the target production
    uint256 targetPetID = LibHarvest.getPet(components, targetProductionID);
    LibPet.sync(components, targetPetID);
    require(LibKill.isLiquidatableBy(components, targetPetID, petID), "Pet: you lack violence");

    // evaluate the outcome
    uint256 bounty = LibHarvest.getBalance(components, targetProductionID);
    uint256 salvage = LibKill.calcSalvage(components, targetPetID, bounty);
    uint256 spoils = LibKill.calcSpoils(components, petID, bounty - salvage);
    uint256 strain = LibPet.calcStrain(components, petID, spoils);
    uint256 karma = LibKill.calcKarma(components, petID, targetPetID);

    // log the liquidation event
    {
      Stat memory sourceHealth = LibStat.getHealth(components, petID);
      Stat memory targetHealth = LibStat.getHealth(components, targetPetID);
      emit KamiLiquidated(
        LibPet.getIndex(components, petID),
        sourceHealth.sync,
        StatLib.calcTotal(sourceHealth),
        LibPet.getIndex(components, targetPetID),
        targetHealth.sync,
        StatLib.calcTotal(targetHealth),
        bounty.toUint32(),
        salvage.toUint32(),
        spoils.toUint32(),
        strain.toUint32(),
        karma.toUint32(),
        block.timestamp.toUint64()
      );
    }

    // transfer musu and drain health accordingly
    if (salvage > 0) {
      uint256 victimAccountID = LibPet.getAccount(components, targetPetID);
      LibInventory.incFor(components, victimAccountID, MUSU_INDEX, salvage);
    }
    LibInventory.incFor(components, productionID, MUSU_INDEX, spoils);
    LibPet.drain(components, petID, SafeCastLib.toInt32(strain + karma));

    // kill the target and shut off the production
    LibPet.kill(components, targetPetID);
    LibHarvest.stop(components, targetProductionID);
    LibKill.create(world, components, petID, targetPetID, nodeID, bounty, spoils);
    LibPet.setLastActionTs(components, petID, block.timestamp);

    // standard logging and tracking
    LibScore.incFor(components, accID, "LIQUIDATE", 1);
    LibKill.logTotals(components, accID, LibNode.getIndex(components, nodeID));
    LibKill.logVictim(components, accID, LibPet.getAccount(components, targetPetID));
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(uint256 targetProductionID, uint256 petID) public returns (bytes memory) {
    return execute(abi.encode(targetProductionID, petID));
  }
}
