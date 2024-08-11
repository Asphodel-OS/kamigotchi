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
import { TimeResetComponent, ID as TimeResetCompID } from "components/TimeResetComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";

import { LibAffinity } from "libraries/utils/LibAffinity.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibData } from "libraries/LibData.sol";
import { LibInventory, MUSU_INDEX } from "libraries/LibInventory.sol";
import { LibKill } from "libraries/LibKill.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibPhase } from "libraries/utils/LibPhase.sol";
import { LibStat } from "libraries/LibStat.sol";

uint256 constant RATE_PREC = 9;

/*
 * LibHarvest handles all retrieval and manipulation of mining nodes/productions
 */
library LibHarvest {
  using SafeCastLib for int32;
  using SafeCastLib for uint32;
  using SafeCastLib for int256;
  using SafeCastLib for uint256;

  /////////////////
  // INTERACTIONS

  // Creates a production for a pet at a deposit. Assumes one doesn't already exist.
  function create(
    IUintComp components,
    uint256 nodeID,
    uint256 petID
  ) internal returns (uint256 id) {
    id = genID(petID);
    IsProductionComponent(getAddressById(components, IsProdCompID)).set(id);
    IdPetComponent(getAddressById(components, IdPetCompID)).set(id, petID);
    IdNodeComponent(getAddressById(components, IdNodeCompID)).set(id, nodeID);
    IndexNodeComponent(getAddressById(components, IndexNodeCompID)).set(
      id,
      LibNode.getIndex(components, nodeID)
    );
  }

  // claim the existing balance on a Production to the Pet's owner (Account)
  // assume the production is Active
  function claim(IUintComp components, uint256 id) internal returns (uint256) {
    uint256 petID = getPet(components, id);
    uint256 accID = LibPet.getAccount(components, petID);

    uint256 balance = getBalance(components, id);
    LibInventory.transferFor(components, id, accID, MUSU_INDEX, balance);
    return balance;
  }

  function resetIntensity(IUintComp components, uint256 id) public {
    setResetTs(components, id, block.timestamp);
  }

  // Starts an _existing_ production if not already started.
  function start(IUintComp components, uint256 id) internal {
    setState(components, id, "ACTIVE");
    LibInventory.setFor(components, id, MUSU_INDEX, 0);
    setStartTs(components, id, block.timestamp);
    setResetTs(components, id, block.timestamp); // intensity reset time
    setLastTs(components, id, block.timestamp);
  }

  // Stops an _existing_ production. All potential proceeds will be lost after this point.
  function stop(IUintComp components, uint256 id) internal {
    setState(components, id, "INACTIVE");
  }

  // snapshot a production's balance and time. return the balance gained
  // also logs the harvest time since the last sync
  function sync(IUintComp components, uint256 id) public returns (uint256 netBounty) {
    if (isActive(components, id)) {
      netBounty = calcBounty(components, id);
      LibInventory.incFor(components, id, MUSU_INDEX, netBounty);

      uint256 timeDelta = block.timestamp - getLastTs(components, id);
      uint256 accID = LibPet.getAccount(components, getPet(components, id));
      logHarvestTime(components, accID, timeDelta);
      setLastTs(components, id, block.timestamp);
    }
  }

  /////////////////////
  // CALCULATIONS (time)

  // Calculate the duration since a production last started, measured in seconds.
  function calcDuration(IUintComp components, uint256 id) internal view returns (uint256) {
    return block.timestamp - getLastTs(components, id);
  }

  function calcIntensityDuration(IUintComp components, uint256 id) internal view returns (uint256) {
    return block.timestamp - getResetTs(components, id);
  }

  /////////////////////
  // CALCULATIONS

  // Calculate the accrued output of a harvest since the pet's last sync.
  function calcBounty(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!isActive(components, id)) return 0;
    uint256 petID = getPet(components, id);
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_HARV_BOUNTY");
    int256 boostBonus = LibBonus.getRaw(components, petID, "HARV_BOUNTY_BOOST");

    uint256 base = calcFertility(components, id);
    uint256 nudge = calcIntensity(components, id);
    uint256 rate = base + nudge;
    uint256 ratio = calcDuration(components, id);
    uint256 boost = (config[6].toInt256() + boostBonus).toUint256();

    // precision is only divided this time as applied > final (1e0)
    uint256 precision = 10 ** (RATE_PREC + config[3] + config[7]);
    return (rate * ratio * boost) / precision;
  }

  // Calculate the efficacy of the core harvesting calc (min 0).
  // Efficacy is a Boost on Fertility and precision is set by its (F's) config.
  function calcEfficacy(
    IUintComp components,
    uint256 id,
    uint256 base
  ) internal view returns (uint256) {
    uint256 petID = getPet(components, id);
    uint256 nodeID = getNode(components, id);
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_HARV_EFFICACY");

    // pull the base efficacy shifts from the config
    LibAffinity.Shifts memory baseEfficacyShifts = LibAffinity.Shifts({
      base: config[0].toInt256(),
      up: config[1].toInt256(),
      down: -1 * config[2].toInt256()
    });

    // pull the bonus efficacy shifts from the pet
    LibAffinity.Shifts memory bonusEfficacyShifts = LibAffinity.Shifts({
      base: int(0),
      up: LibBonus.getRaw(components, petID, "HARV_FERTILITY_BOOST"),
      down: int(0)
    });

    // sum each applied shift with the base efficacy value to get the final value
    int256 efficacy = base.toInt256();
    string memory nodeAff = LibNode.getAffinity(components, nodeID);
    string[] memory petAffs = LibPet.getAffinities(components, petID);
    for (uint256 i = 0; i < petAffs.length; i++) {
      efficacy += LibAffinity.calcEfficacyShift(
        LibAffinity.getHarvestEffectiveness(petAffs[i], nodeAff),
        baseEfficacyShifts,
        bonusEfficacyShifts
      );
    }

    return (efficacy < 0) ? 0 : uint(efficacy);
  }

  // Calculate the rate of harvest, measured in musu/s. Assume active (1e9 precision).
  function calcFertility(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 petID = getPet(components, id);
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_HARV_FERTILITY");

    uint256 power = LibPet.calcTotalPower(components, petID).toUint256();
    uint256 ratio = config[2]; // fertility core
    uint256 boost = calcEfficacy(components, id, config[6]);
    uint256 precision = 10 ** (RATE_PREC - (config[3] + config[7]));
    return (precision * power * ratio * boost) / 3600;
  }

  // Calculate the intensity of a production, measured in musu/s (1e9 precision)
  function calcIntensity(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 petID = getPet(components, id);
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_HARV_INTENSITY");

    uint256 base = calcIntensityDuration(components, id);
    uint256 nudge = 60 * LibBonus.getRaw(components, petID, "HARV_INTENSITY_NUDGE").toUint256();
    uint256 ratio = config[2]; // intensity core (musu/s)
    uint256 boost = 60 * config[6]; // period, converted to seconds. apply as inverted boost
    uint256 precision = 10 ** (RATE_PREC - config[3] + config[7]); // boost is inverted
    return (precision * (base + nudge) * ratio) / boost / 3600;
  }

  /////////////////
  // CHECKERS

  function isActive(IUintComp components, uint256 id) internal view returns (bool) {
    return LibString.eq("ACTIVE", getState(components, id));
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

  function setResetTs(IUintComp components, uint256 id, uint256 timeReset) internal {
    TimeResetComponent(getAddressById(components, TimeResetCompID)).set(id, timeReset);
  }

  function setStartTs(IUintComp components, uint256 id, uint256 timeStart) internal {
    TimeStartComponent(getAddressById(components, TimeStartCompID)).set(id, timeStart);
  }

  /////////////////
  // GETTERS

  function getBalance(IUintComp components, uint256 id) internal view returns (uint256) {
    return LibInventory.getBalanceOf(components, id, MUSU_INDEX);
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

  // the check here is just a patch to address broken kamis in the current deployment
  function getResetTs(IUintComp components, uint256 id) internal view returns (uint256) {
    TimeResetComponent comp = TimeResetComponent(getAddressById(components, TimeResetCompID));
    if (comp.has(id)) return comp.get(id);
    return block.timestamp; // if missing then we have no intensity
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

  function logHarvestTime(IUintComp components, uint256 accID, uint256 value) internal {
    LibData.inc(components, accID, 0, "HARVEST_TIME", value);
  }

  function logAmounts(
    IUintComp components,
    uint256 accID,
    uint32 nodeIndex,
    string memory affinity,
    uint32 itemIndex,
    uint256 amt
  ) internal {
    uint32[] memory indices = new uint32[](3);
    indices[0] = nodeIndex;
    indices[1] = itemIndex;
    indices[2] = 0; // temp patch to fix quest 21 not having index. need adjust shapes to fix
    string[] memory types = new string[](3);
    types[0] = "HARVEST_AT_NODE";
    types[1] = LibString.concat("HARVEST_AFFINITY_", affinity);
    types[2] = LibString.concat("HARVEST_WHEN_", LibPhase.getName(block.timestamp));

    LibData.inc(components, accID, indices, types, amt);
  }

  /////////////////////
  // UTILS

  function genID(uint256 petID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("production", petID)));
  }
}
