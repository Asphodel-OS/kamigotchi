// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IdNodeComponent, ID as IdNodeCompID } from "components/IdNodeComponent.sol";
import { IdPetComponent, ID as IdPetCompID } from "components/IdPetComponent.sol";
import { IsProductionComponent, ID as IsProdCompID } from "components/IsProductionComponent.sol";
import { RateComponent, ID as RateCompID } from "components/RateComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRegistryAffinity } from "libraries/LibRegistryAffinity.sol";

/*
 * LibProduction handles all retrieval and manipulation of mining nodes/productions
 */
library LibProduction {
  /////////////////////
  // INTERACTIONS

  // Creates a production for a pet at a deposit. Assumes one doesn't already exist.
  function create(
    IWorld world,
    IUintComp components,
    uint256 nodeID,
    uint256 petID
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsProductionComponent(getAddressById(components, IsProdCompID)).set(id);
    IdPetComponent(getAddressById(components, IdPetCompID)).set(id, petID);
    IdNodeComponent(getAddressById(components, IdNodeCompID)).set(id, nodeID);
    return id;
  }

  // Resets the starting block of a production to the current block
  function reset(IUintComp components, uint256 id) internal {
    setTimeStart(components, id, block.timestamp);
  }

  // Starts an _existing_ production if not already started.
  function start(IUintComp components, uint256 id) internal {
    setState(components, id, "ACTIVE");
    reset(components, id);
    setRate(components, id, calcRate(components, id)); // always last
  }

  // Stops an _existing_ production. All potential proceeds will be lost after this point.
  function stop(IUintComp components, uint256 id) internal {
    setState(components, id, "INACTIVE");
    setRate(components, id, 0);
  }

  /////////////////////
  // CALCULATIONS

  // Calculate the multiplier for harvesting. This may include multipliers other than
  // affinity in the future
  function calcHarvestMultiplier(IUintComp components, uint256 id) internal view returns (uint256) {
    return calcHarvestingAffinityMultiplier(components, id);
  }

  // Calculate the harvesting multiplier resulting from affinity matching
  // (precision set by HARVEST_RATE_MULT_PREC)
  function calcHarvestingAffinityMultiplier(
    IUintComp components,
    uint256 id
  ) internal view returns (uint256) {
    uint256 nodeID = getNode(components, id);
    string memory nodeAff = LibNode.getAffinity(components, nodeID);

    uint256 petID = getPet(components, id);
    string[] memory petAffs = LibPet.getAffinities(components, petID);

    // layer the multipliers due to each trait on top of each other
    uint256 totMultiplier = 1;
    for (uint256 i = 0; i < petAffs.length; i++) {
      totMultiplier *= LibRegistryAffinity.getHarvestMultiplier(components, petAffs[i], nodeAff);
    }
    return totMultiplier;
  }

  // Calculate the reward for liquidating this production, measured in KAMI
  function calcBounty(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 output = calcOutput(components, id);
    uint256 base = LibConfig.getValueOf(components, "LIQ_BOUNTY_BASE");
    uint256 precision = 10 ** LibConfig.getValueOf(components, "LIQ_BOUNTY_BASE_PREC");
    return (output * base) / precision;
  }

  // Calculate the duration since a production last started, measured in seconds.
  function calcDuration(IUintComp components, uint256 id) internal view returns (uint256) {
    return block.timestamp - getStartTime(components, id);
  }

  // Calculate the reward we would expect from a production, collected at the
  // current time, measured in KAMI. INACTIVE productions will return 0.
  function calcOutput(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 rate = getRate(components, id);
    uint256 duration = calcDuration(components, id);
    uint256 precision = 10 ** LibConfig.getValueOf(components, "HARVEST_RATE_PREC");
    return (rate * duration) / precision;
  }

  // Calculate the rate of a production, measured in KAMI/s (precision set by HARVEST_RATE_PREC)
  function calcRate(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!isActive(components, id)) return 0;

    uint256 petID = getPet(components, id);
    uint256 power = LibPet.calcTotalPower(components, petID);
    uint256 precision = 10 ** LibConfig.getValueOf(components, "HARVEST_RATE_PREC");
    uint256 base = LibConfig.getValueOf(components, "HARVEST_RATE_BASE");
    uint256 basePrecision = 10 ** LibConfig.getValueOf(components, "HARVEST_RATE_BASE_PREC");
    uint256 mult = calcHarvestMultiplier(components, id);
    uint256 multPrecision = 10 ** LibConfig.getValueOf(components, "HARVEST_RATE_MULT_PREC");

    return (precision * base * power * mult) / (3600 * basePrecision * multPrecision);
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
    uint256 id,
    uint256 sourcePetID
  ) external view returns (bool) {
    uint256 targetPetID = getPet(components, id);
    uint256 targetHealth = LibPet.getLastHealth(components, targetPetID);
    uint256 targetTotalHealth = LibPet.calcTotalHealth(components, targetPetID);
    uint256 threshold = LibPet.calcThreshold(components, sourcePetID, targetPetID); // 1e18 precision
    return threshold * targetTotalHealth > targetHealth * 1e18;
  }

  /////////////////
  // SETTERS

  // Set the node for a pet's production
  function setNode(IUintComp components, uint256 id, uint256 nodeID) internal {
    if (getNode(components, id) != nodeID) {
      IdNodeComponent(getAddressById(components, IdNodeCompID)).set(id, nodeID);
    }
  }

  function setRate(IUintComp components, uint256 id, uint256 rate) internal {
    RateComponent(getAddressById(components, RateCompID)).set(id, rate);
  }

  function setState(IUintComp components, uint256 id, string memory state) internal {
    StateComponent(getAddressById(components, StateCompID)).set(id, state);
  }

  function setTimeStart(IUintComp components, uint256 id, uint256 timeStart) internal {
    TimeStartComponent(getAddressById(components, TimeStartCompID)).set(id, timeStart);
  }

  /////////////////
  // GETTERS

  function getNode(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdNodeComponent(getAddressById(components, IdNodeCompID)).getValue(id);
  }

  function getPet(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdPetComponent(getAddressById(components, IdPetCompID)).getValue(id);
  }

  function getRate(IUintComp components, uint256 id) internal view returns (uint256) {
    return RateComponent(getAddressById(components, RateCompID)).getValue(id);
  }

  function getState(IUintComp components, uint256 id) internal view returns (string memory) {
    return StateComponent(getAddressById(components, StateCompID)).getValue(id);
  }

  function getStartTime(IUintComp components, uint256 id) internal view returns (uint256) {
    return TimeStartComponent(getAddressById(components, TimeStartCompID)).getValue(id);
  }

  /////////////////
  // QUERIES

  // get a production by a pet. assumed only 1
  function getForPet(IUintComp components, uint256 petID) internal view returns (uint256 result) {
    uint256[] memory results = _getAllX(components, 0, petID, "");
    if (results.length != 0) {
      result = results[0];
    }
  }

  // get all the active productions on a node
  function getAllOnNode(
    IUintComp components,
    uint256 nodeID
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsProdCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdNodeCompID),
      abi.encode(nodeID)
    );
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, StateCompID),
      abi.encode("ACTIVE")
    );

    return LibQuery.query(fragments);
  }

  function getAll(IUintComp components) internal view returns (uint256[] memory) {
    return _getAllX(components, 0, 0, "");
  }

  // Retrieves all productions based on any defined filters
  function _getAllX(
    IUintComp components,
    uint256 nodeID,
    uint256 petID,
    string memory state
  ) internal view returns (uint256[] memory) {
    uint256 numFilters;
    if (nodeID != 0) numFilters++;
    if (petID != 0) numFilters++;
    if (!LibString.eq(state, "")) numFilters++;

    QueryFragment[] memory fragments = new QueryFragment[](numFilters + 1);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsProdCompID), "");

    uint256 filterCount;
    if (nodeID != 0) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IdNodeCompID),
        abi.encode(nodeID)
      );
    }
    if (petID != 0) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IdPetCompID),
        abi.encode(petID)
      );
    }
    if (!LibString.eq(state, "")) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, StateCompID),
        abi.encode(state)
      );
    }

    return LibQuery.query(fragments);
  }
}
