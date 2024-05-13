// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
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

import { LibAffinity } from "libraries/LibAffinity.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibCoin } from "libraries/LibCoin.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibStat } from "libraries/LibStat.sol";

struct HarvestRates {
  uint8 prec;
  uint32 base;
  uint8 basePrec;
  uint8 multiplierPrec;
}

uint256 constant FERTILITY_PREC = 9;

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
    setStartTs(components, id, block.timestamp);
    setLastTs(components, id, block.timestamp);
  }

  // Stops an _existing_ production. All potential proceeds will be lost after this point.
  function stop(IUintComp components, uint256 id) internal {
    setState(components, id, "INACTIVE");
  }

  // snapshot a production's the balance and time. return the balance delta
  function sync(IUintComp components, uint256 id) public returns (uint256 delta) {
    if (isActive(components, id)) {
      delta = calcOutput(components, id);
      LibCoin.inc(components, id, delta);
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
    if (!isActive(components, id)) return 0;

    uint256 petID = getPet(components, id);
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_HARV_BOUNTY");
    uint256 boostBonus = uint256(LibBonus.getRaw(components, petID, "HARVEST_OUTPUT"));

    uint256 fertility = calcFertility(components, id);
    uint256 dedication = 0; //  getDedication(components, id);
    uint256 rate = fertility + dedication;
    uint256 duration = calcDuration(components, id);
    uint256 boost = uint256(config[6]) + boostBonus;

    // precision is only divided this time as applied > final (0)
    uint256 precision = uint256(config[1] + config[3] + config[7]);
    return (rate * duration * boost) / (10 ** precision);
  }

  // Calculate the rate of harvest production, measured in $MUSU/s (1e9 precision)
  function calcFertility(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!isActive(components, id)) return 0;

    uint256 petID = getPet(components, id);
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_HARV_FERTILITY");
    uint256 base = LibPet.calcTotalPower(components, petID).toUint256();
    uint256 ratio = uint256(config[2]);

    // atm we keep this as close to how it's already implemented by simply
    // scaling down the affinity mult output to match our expected precision.
    uint256 boostBonus = calcAffinityMult(components, id, petID) / 1e3;

    // What we want to do instead is track the unchanging neutral multiplier
    // and the overall precision of the affinity mult on the config (1000, 3).
    // we should then shift that value based on any pos/neg affinity matchups
    // so that the application is ADDITIVE rather than MULTIPLICATIVE.
    // this should lead to some saner precision handling
    uint256 boost = uint256(config[6]) + boostBonus;
    boost -= uint256(config[6]); // omit this line once above implementation is corrected

    uint256 precision = FERTILITY_PREC - uint256(config[3] + config[7]);
    return ((10 ** precision) * (base * ratio * boost)) / 3600;
  }

  // Calculate the harvesting multiplier resulting from affinity matching
  // (precision set by HARVEST_RATE_MULT_PREC)
  function calcAffinityMult(
    IUintComp components,
    uint256 id,
    uint256 petID
  ) internal view returns (uint256) {
    uint256 nodeID = getNode(components, id);
    string memory nodeAff = LibNode.getAffinity(components, nodeID);
    string[] memory petAffs = LibPet.getAffinities(components, petID);

    // get affinity multipliers, with bonuses
    LibAffinity.Multipliers memory mults = LibAffinity.calcMultipliers(
      components,
      "HARVEST_RATE_MULT_AFF",
      petID,
      "HARVEST_AFFINITY_MULT"
    );

    // layer the multipliers due to each trait on top of each other
    uint256 totMultiplier = 1;
    for (uint256 i = 0; i < petAffs.length; i++)
      totMultiplier *= LibAffinity.getMultiplier(
        mults,
        LibAffinity.getHarvestEfficacy(petAffs[i], nodeAff)
      );
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
