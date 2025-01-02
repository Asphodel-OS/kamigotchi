// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IdSourceComponent, ID as IdSourceCompID } from "components/IdSourceComponent.sol";
import { RateComponent, ID as RateCompID } from "components/RateComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { TimeLastComponent, ID as TimeLastCompID } from "components/TimeLastComponent.sol";
import { TimeResetComponent, ID as TimeResetCompID } from "components/TimeResetComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibAffinity } from "libraries/utils/LibAffinity.sol";
import { LibComp } from "libraries/utils/LibComp.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibPhase } from "libraries/utils/LibPhase.sol";

import { LibBonus } from "libraries/LibBonus.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibData } from "libraries/LibData.sol";
import { LibInventory, MUSU_INDEX } from "libraries/LibInventory.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibStat } from "libraries/LibStat.sol";

uint256 constant RATE_PREC = 6;

/*
 * LibHarvest handles all retrieval and calculation of harvest outputs
 */
library LibHarvest {
  using LibComp for IComponent;
  using SafeCastLib for int32;
  using SafeCastLib for uint32;
  using SafeCastLib for int256;
  using SafeCastLib for uint256;

  /////////////////
  // INTERACTIONS

  // Creates a harvest for a pet at a deposit. Assumes one doesn't already exist.
  function create(
    IUintComp components,
    uint256 nodeID,
    uint256 kamiID
  ) internal returns (uint256 id) {
    id = genID(kamiID);
    LibEntityType.set(components, id, "HARVEST");
    IdHolderComponent(getAddrByID(components, IdHolderCompID)).set(id, kamiID);
    IdSourceComponent(getAddrByID(components, IdSourceCompID)).set(id, nodeID);
  }

  /// @notice claim the existing balance on a Harvest to the Pet's owner (Account)
  /// @dev assume harvest is active. toID (usually account) is derived externally from kamiID
  function claim(IUintComp components, uint256 prodID, uint256 toID) internal returns (uint256) {
    // safely get and reset existing balance
    ValueComponent valComp = ValueComponent(getAddrByID(components, ValueCompID));
    uint256 balance = valComp.safeGet(prodID);
    if (balance > 0) valComp.set(prodID, 0);

    LibInventory.incFor(components, toID, MUSU_INDEX, balance);
    return balance;
  }

  function resetIntensity(IUintComp components, uint256 id) internal {
    TimeResetComponent(getAddrByID(components, TimeResetCompID)).set(id, block.timestamp);
  }

  // Starts an _existing_ harvest if not already started.
  function start(IUintComp components, uint256 id) internal {
    StateComponent(getAddrByID(components, StateCompID)).set(id, string("ACTIVE"));
    TimeStartComponent(getAddrByID(components, TimeStartCompID)).set(id, block.timestamp);
    TimeResetComponent(getAddrByID(components, TimeResetCompID)).set(id, block.timestamp); // intensity reset time
    TimeLastComponent(getAddrByID(components, TimeLastCompID)).set(id, block.timestamp);
  }

  // Stops an _existing_ harvest. All potential proceeds will be lost after this point.
  function stop(IUintComp components, uint256 id) internal {
    StateComponent(getAddrByID(components, StateCompID)).set(id, string("INACTIVE"));
    ValueComponent(getAddrByID(components, ValueCompID)).set(id, 0);
  }

  // snapshot a harvest's balance and time. return the balance gained
  // also logs the harvest time since the last sync
  function sync(IUintComp components, uint256 id) internal returns (uint256 netBounty) {
    if (isActive(components, id)) {
      netBounty = calcBounty(components, id);
      incBounty(components, id, netBounty);
      TimeLastComponent(getAddrByID(components, TimeLastCompID)).set(id, block.timestamp);
    }
  }

  function incBounty(IUintComp components, uint256 id, uint256 amt) internal {
    ValueComponent(getAddrByID(components, ValueCompID)).inc(id, amt);
  }

  /////////////////////
  // CALCULATIONS (time)

  // Calculate the duration since a harvest last started, measured in seconds.
  function calcDuration(IUintComp components, uint256 id) internal view returns (uint256) {
    return block.timestamp - getLastTs(components, id);
  }

  function calcIntensityDuration(IUintComp components, uint256 id) internal view returns (uint256) {
    return block.timestamp - getResetTs(components, id);
  }

  /////////////////////
  // CALCULATIONS

  // Calculate the accrued output of a harvest since the kami's last sync.
  function calcBounty(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!isActive(components, id)) return 0;
    uint256 kamiID = getKami(components, id);
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_HARV_BOUNTY");
    int256 boostBonus = LibBonus.getFor(components, "HARV_BOUNTY_BOOST", kamiID);

    uint256 base = calcFertility(components, id, kamiID);
    uint256 nudge = calcIntensity(components, id, kamiID);
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
    uint256 base,
    uint256 kamiID
  ) internal view returns (uint256) {
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
      up: LibBonus.getFor(components, "HARV_FERTILITY_BOOST", kamiID),
      down: int(0)
    });

    // sum each applied shift with the base efficacy value to get the final value
    int256 efficacy = base.toInt256();
    string memory nodeAff = LibNode.getAffinity(components, nodeID);
    string[] memory petAffs = LibKami.getAffinities(components, kamiID);
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
  function calcFertility(
    IUintComp components,
    uint256 id,
    uint256 kamiID
  ) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_HARV_FERTILITY");

    uint256 power = LibStat.getTotal(components, "POWER", kamiID).toUint256();
    uint256 ratio = config[2]; // fertility core
    uint256 boost = calcEfficacy(components, id, config[6], kamiID);
    uint256 precision = 10 ** (RATE_PREC - (config[3] + config[7]));
    return (precision * power * ratio * boost) / 3600;
  }

  // Calculate the intensity of a harvest, measured in musu/s (1e9 precision)
  // NOTE: a bit of a hack, scales violence by commandeering nudge slot
  function calcIntensity(
    IUintComp components,
    uint256 id,
    uint256 kamiID
  ) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_HARV_INTENSITY");

    uint256 base = config[0] * LibStat.getTotal(components, "VIOLENCE", kamiID).toUint256(); // odd application of nudge slot
    uint256 nudge = calcIntensityDuration(components, id) / 60; // minutes, rounded down
    uint256 ratio = config[2]; // period, in minutes. scaled to accomodate current skill balancing
    uint256 boost = config[6];
    boost += LibBonus.getForUint256(components, "HARV_INTENSITY_BOOST", kamiID);
    uint256 precision = 10 ** (RATE_PREC - config[7] + config[3]); // ratio is inverted
    return (precision * (base + nudge) * boost) / (ratio * 3600);
  }

  /////////////////
  // CHECKERS

  function isActive(IUintComp components, uint256 id) internal view returns (bool) {
    return getCompByID(components, StateCompID).eqString(id, "ACTIVE");
  }

  /////////////////
  // SETTERS

  // Set the node for a pet's harvest
  function setNode(IUintComp components, uint256 id, uint256 nodeID) internal {
    IdSourceComponent comp = IdSourceComponent(getAddrByID(components, IdSourceCompID));
    if (comp.get(id) != nodeID) comp.set(id, nodeID);
  }

  /////////////////
  // GETTERS

  function getBalance(IUintComp components, uint256 id) internal view returns (uint256) {
    return ValueComponent(getAddrByID(components, ValueCompID)).safeGet(id);
  }

  function getLastTs(IUintComp components, uint256 id) internal view returns (uint256 ts) {
    return TimeLastComponent(getAddrByID(components, TimeLastCompID)).get(id);
  }

  function getNode(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdSourceComponent(getAddrByID(components, IdSourceCompID)).get(id);
  }

  function getKami(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdHolderComponent(getAddrByID(components, IdHolderCompID)).get(id);
  }

  // the check here is just a patch to address broken kamis in the current deployment
  function getResetTs(IUintComp components, uint256 id) internal view returns (uint256) {
    TimeResetComponent comp = TimeResetComponent(getAddrByID(components, TimeResetCompID));
    if (comp.has(id)) return comp.get(id);
    return block.timestamp; // if missing then we have no intensity
  }

  function getStartTs(IUintComp components, uint256 id) internal view returns (uint256) {
    return TimeStartComponent(getAddrByID(components, TimeStartCompID)).get(id);
  }

  /////////////////
  // QUERIES

  // get a harvest by a pet. assumed only 1
  function getForKami(IUintComp components, uint256 kamiID) internal view returns (uint256 result) {
    uint256 id = genID(kamiID);
    return LibEntityType.isShape(components, id, "HARVEST") ? id : 0;
  }

  /////////////////////
  // LOGGING

  /// @notice logs total harvest time for all nodes (index 0) and current node
  /// @dev called before syncing health
  function logHarvestTimes(
    IUintComp components,
    uint256 accID,
    uint32 nodeIndex,
    uint256 prodID
  ) public {
    uint32[] memory indices = new uint32[](2);
    indices[0] = 0;
    indices[1] = nodeIndex;
    string[] memory types = new string[](2);
    types[0] = "HARVEST_TIME";
    types[1] = "HARVEST_TIME";
    LibData.inc(
      components,
      accID,
      indices,
      types,
      block.timestamp - getStartTs(components, prodID)
    );
  }

  function logAmounts(
    IUintComp components,
    uint256 accID,
    uint32 nodeIndex,
    string memory affinity,
    uint32 itemIndex,
    uint256 amt
  ) public {
    uint32[] memory indices = new uint32[](3);
    indices[0] = nodeIndex;
    indices[1] = itemIndex;
    indices[2] = itemIndex;
    string[] memory types = new string[](3);
    types[0] = "HARVEST_AT_NODE";
    types[1] = LibString.concat("HARVEST_AFFINITY_", affinity);
    types[2] = LibString.concat("HARVEST_WHEN_", LibPhase.getName(block.timestamp));

    LibData.inc(components, accID, indices, types, amt);
  }

  /////////////////////
  // UTILS

  function genID(uint256 kamiID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("harvest", kamiID)));
  }
}
