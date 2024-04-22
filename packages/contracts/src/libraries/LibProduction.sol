// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { SafeCastLib } from "libraries/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IdNodeComponent, ID as IdNodeCompID } from "components/IdNodeComponent.sol";
import { IdPetComponent, ID as IdPetCompID } from "components/IdPetComponent.sol";
import { IndexNodeComponent, ID as IndexNodeCompID } from "components/IndexNodeComponent.sol";
import { IsProductionComponent, ID as IsProdCompID } from "components/IsProductionComponent.sol";
import { RateComponent, ID as RateCompID } from "components/RateComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { TimeLastComponent, ID as TimeLastCompID } from "components/TimeLastComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";

import { LibBonus } from "libraries/LibBonus.sol";
import { LibCoin } from "libraries/LibCoin.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRegistryAffinity } from "libraries/LibRegistryAffinity.sol";
import { LibStat } from "libraries/LibStat.sol";

struct HarvestRates {
  uint8 prec;
  uint32 base;
  uint8 basePrec;
  uint8 multiplierPrec;
}

/*
 * LibProduction handles all retrieval and manipulation of mining nodes/productions
 */
library LibProduction {
  using SafeCastLib for int32;
  /////////////////
  // INTERACTIONS

  // Creates a production for a pet at a deposit. Assumes one doesn't already exist.
  function create(IUintComp components, uint256 nodeID, uint256 petID) internal returns (uint256) {
    uint256 id = genID(petID);
    IsProductionComponent(getAddressById(components, IsProdCompID)).set(id);
    IdPetComponent(getAddressById(components, IdPetCompID)).set(id, petID);
    IdNodeComponent(getAddressById(components, IdNodeCompID)).set(id, nodeID);
    IndexNodeComponent(getAddressById(components, IndexNodeCompID)).set(
      id,
      LibNode.getIndex(components, nodeID)
    );
    return id;
  }

  // claim the existing balance on a Production to the Pet's owner (Account)
  // assume the production is Active
  function claim(IUintComp components, uint256 id) internal returns (uint256) {
    uint256 petID = getPet(components, id);
    uint256 accountID = LibPet.getAccount(components, petID);

    uint256 balance = getBalance(components, id);
    LibCoin.inc(components, accountID, balance);
    LibCoin._set(components, id, 0);
    return balance;
  }

  // Starts an _existing_ production if not already started.
  function start(IUintComp components, uint256 id) public {
    setState(components, id, "ACTIVE");
    LibCoin._set(components, id, 0);
    setRate(components, id, calcRate(components, id)); // always last
    setStartTs(components, id, block.timestamp);
    setLastTs(components, id, block.timestamp);
  }

  // Stops an _existing_ production. All potential proceeds will be lost after this point.
  function stop(IUintComp components, uint256 id) internal {
    setState(components, id, "INACTIVE");
    setRate(components, id, 0);
  }

  // snapshot a production's the balance and time. return the balance delta
  function sync(IUintComp components, uint256 id) public returns (uint256 delta) {
    if (isActive(components, id)) {
      delta = calcOutput(components, id);
      LibCoin.inc(components, id, delta);
      setRate(components, id, calcRate(components, id));
      setLastTs(components, id, block.timestamp);
    }
  }

  /////////////////////
  // CALCULATIONS

  // Calculate the duration since a production last started, measured in seconds.
  function calcDuration(IUintComp components, uint256 id) internal view returns (uint256) {
    return block.timestamp - getLastTs(components, id);
  }

  // Calculate the accrued output of the production since the pet's last snapshot
  function calcOutput(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 rate = getRate(components, id);
    uint256 duration = calcDuration(components, id);
    uint256 precision = 10 ** uint256(LibConfig.getArray(components, "HARVEST_RATE")[0]);
    return (rate * duration) / precision;
  }

  // Calculate the rate of a production, measured in $MUSU/s (precision set by HARVEST_RATE_PREC)
  function calcRate(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!isActive(components, id)) return 0;

    uint32[8] memory values = LibConfig.getArray(components, "HARVEST_RATE");

    uint256 petID = getPet(components, id);
    uint256 power = uint256(uint32(LibPet.calcTotalPower(components, petID)));
    uint256 precision = 10 ** uint256(values[0]);
    uint256 base = uint256(values[1]);
    uint256 basePrecision = 10 ** uint256(values[2]);
    uint256 mult = calcRateMultiplier(components, id);
    uint256 multPrecision = 10 ** uint256(values[3]);

    return (precision * base * power * mult) / (3600 * basePrecision * multPrecision);
  }

  // Calculate the multiplier for harvesting
  function calcRateMultiplier(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 petID = getPet(components, id);
    uint256 bonusMult = LibBonus.getPercent(components, petID, "HARVEST_OUTPUT");
    uint256 affinityMult = calcRateAffinityMultiplier(components, id, petID);
    return affinityMult * bonusMult;
  }

  // Calculate the harvesting multiplier resulting from affinity matching
  // (precision set by HARVEST_RATE_MULT_PREC)
  function calcRateAffinityMultiplier(
    IUintComp components,
    uint256 id,
    uint256 petID
  ) internal view returns (uint256) {
    uint256 nodeID = getNode(components, id);
    string memory nodeAff = LibNode.getAffinity(components, nodeID);

    string[] memory petAffs = LibPet.getAffinities(components, petID);

    // layer the multipliers due to each trait on top of each other
    uint256 totMultiplier = 1;
    for (uint256 i = 0; i < petAffs.length; i++)
      totMultiplier *= LibRegistryAffinity.getHarvestMultiplier(components, petAffs[i], nodeAff);
    return totMultiplier;
  }

  /////////////////
  // CHECKERS

  function isActive(IUintComp components, uint256 id) internal view returns (bool) {
    return LibString.eq("ACTIVE", getState(components, id));
  }

  // Check whether the source pet can liquidate the target production, based on pet stats.
  // NOTE: this asssumes that both the source and target pet's health has been synced in
  // this block and that the source can attack the target.
  function isLiquidatableBy(
    IUintComp components,
    uint256 targetPetID,
    uint256 sourcePetID
  ) public view returns (bool) {
    uint256 health = (LibStat.getHealth(components, targetPetID).sync).toUint256();
    uint256 totalHealth = LibPet.calcTotalHealth(components, targetPetID).toUint256();
    uint256 threshold = LibPet.calcThreshold(components, sourcePetID, targetPetID); // 1e18 precision
    return threshold * totalHealth > health * 1e18;
  }

  /////////////////
  // SETTERS

  // Set the node for a pet's production
  function setNode(IUintComp components, uint256 id, uint256 nodeID) internal {
    IdNodeComponent comp = IdNodeComponent(getAddressById(components, IdNodeCompID));
    if (comp.get(id) != nodeID) {
      comp.set(id, nodeID);
      IndexNodeComponent(getAddressById(components, IndexNodeCompID)).set(
        id,
        LibNode.getIndex(components, nodeID)
      );
    }
  }

  function setRate(IUintComp components, uint256 id, uint256 rate) internal {
    RateComponent(getAddressById(components, RateCompID)).set(id, rate);
  }

  function setState(IUintComp components, uint256 id, string memory state) internal {
    StateComponent(getAddressById(components, StateCompID)).set(id, state);
  }

  function setLastTs(IUintComp components, uint256 id, uint256 timeStart) internal {
    TimeLastComponent(getAddressById(components, TimeLastCompID)).set(id, timeStart);
  }

  function setStartTs(IUintComp components, uint256 id, uint256 timeStart) internal {
    TimeStartComponent(getAddressById(components, TimeStartCompID)).set(id, timeStart);
  }

  /////////////////
  // GETTERS

  function getBalance(IUintComp components, uint256 id) internal view returns (uint256) {
    return LibCoin.get(components, id);
  }

  function getLastTs(IUintComp components, uint256 id) internal view returns (uint256 ts) {
    return TimeLastComponent(getAddressById(components, TimeLastCompID)).get(id);
  }

  function getNode(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdNodeComponent(getAddressById(components, IdNodeCompID)).get(id);
  }

  function getPet(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdPetComponent(getAddressById(components, IdPetCompID)).get(id);
  }

  function getRate(IUintComp components, uint256 id) internal view returns (uint256) {
    return RateComponent(getAddressById(components, RateCompID)).get(id);
  }

  function getState(IUintComp components, uint256 id) internal view returns (string memory) {
    return StateComponent(getAddressById(components, StateCompID)).get(id);
  }

  function getStartTs(IUintComp components, uint256 id) internal view returns (uint256) {
    return TimeStartComponent(getAddressById(components, TimeStartCompID)).get(id);
  }

  /////////////////
  // QUERIES

  // get a production by a pet. assumed only 1
  function getForPet(IUintComp components, uint256 petID) internal view returns (uint256 result) {
    uint256 id = genID(petID);
    return IsProductionComponent(getAddressById(components, IsProdCompID)).has(id) ? id : 0;
  }

  /////////////////////
  // LOGGING

  function logHarvestTime(IUintComp components, uint256 accountID, uint256 value) internal {
    LibDataEntity.inc(components, accountID, 0, "HARVEST_TIME", value);
  }

  /////////////////////
  // UTILS

  function genID(uint256 petID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("production", petID)));
  }
}
