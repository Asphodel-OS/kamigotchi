// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { FixedPointMathLib as LibFPMath } from "solady/utils/FixedPointMathLib.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { IdSourceComponent, ID as IdSourceCompID } from "components/IdSourceComponent.sol";
import { IdTargetComponent, ID as IdTargetCompID } from "components/IdTargetComponent.sol";
import { IndexNodeComponent, ID as IndexNodeCompID } from "components/IndexNodeComponent.sol";
import { IsKillComponent, ID as IsKillCompID } from "components/IsKillComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { TimeComponent, ID as TimeCompID } from "components/TimeComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibAffinity, Shifts } from "libraries/utils/LibAffinity.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibData } from "libraries/LibData.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibHarvest } from "libraries/LibHarvest.sol";
import { LibInventory, MUSU_INDEX } from "libraries/LibInventory.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibPhase } from "libraries/utils/LibPhase.sol";
import { LibStat, Stat, StatLib } from "libraries/LibStat.sol";
import { Gaussian } from "utils/Gaussian.sol";

uint256 constant ANIMOSITY_PREC = 6;

struct KillBalance {
  uint256 bounty;
  uint256 salvage;
  uint256 spoils;
  uint256 strain;
  uint256 karma;
}

// LibKill does maths for liquidation calcs and handles creation of kill logs,
// which track when, where and with whom a murder took place.
library LibKill {
  using LibFPMath for int256;
  using SafeCastLib for int32;
  using SafeCastLib for uint32;
  using SafeCastLib for int256;
  using SafeCastLib for uint256;

  event KamiLiquidated(
    uint64 endTs,
    uint32 nodeIndex,
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
    uint32 karma
  );
  /////////////////
  // INTERACTIONS

  /// @notice send salvage back to victim's owner
  function sendSalvage(IUintComp components, uint256 victimID, uint256 amt) internal {
    if (amt == 0) return;
    uint256 accID = LibKami.getAccount(components, victimID);
    LibInventory.incFor(components, accID, MUSU_INDEX, amt);
    LibExperience.inc(components, victimID, amt);
  }

  /// @notice send spoils to killer's owner
  function sendSpoils(IUintComp components, uint256 killerProdID, uint256 amt) internal {
    if (amt == 0) return;
    LibHarvest.incBounty(components, killerProdID, amt);
  }

  /////////////////
  // CHECKERS

  // Check whether the source pet can liquidate the target harvest, based on pet stats.
  // NOTE: this asssumes that both the source and target pet's health has been synced in
  // this block and that the source can attack the target.
  function isLiquidatableBy(
    IUintComp components,
    uint256 targetKamiID,
    uint256 sourceKamiID
  ) public view returns (bool) {
    uint256 currHealth = LibStat.getCurrent(components, "HEALTH", targetKamiID).toUint256();
    uint256 threshold = calcThreshold(components, sourceKamiID, targetKamiID);
    return threshold > currHealth;
  }

  /////////////////
  // CALCULATIONS

  // Calculate the base liquidation threshold % for target pet when attacked by source pet.
  // H = Φ(ln(v_s / h_t)) * ratio  as proportion of total health (1e6 precision).
  function calcAnimosity(
    IUintComp components,
    uint256 sourceID,
    uint256 targetID
  ) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_LIQ_ANIMOSITY");

    uint256 sourceViolence = LibStat.getTotal(components, "VIOLENCE", sourceID).toUint256();
    uint256 targetHarmony = LibStat.getTotal(components, "HARMONY", targetID).toUint256();
    int256 imbalance = ((1e18 * sourceViolence) / targetHarmony).toInt256();
    uint256 base = Gaussian.cdf(LibFPMath.lnWad(imbalance)).toUint256();
    uint256 ratio = config[2]; // core animosity baseline

    // flipped precision as inputs are more precise than output
    uint256 precision = 10 ** (18 + config[3] - ANIMOSITY_PREC);
    return (base * ratio) / precision;
  }

  // Calculate the affinity multiplier for attacks between two kamis.
  function calcEfficacy(
    IUintComp comps,
    uint256 sourceID,
    uint256 targetID,
    uint256 base
  ) internal view returns (uint256) {
    // pull the bonus efficacy shifts from the pets
    int256 atkBonus = LibBonus.getFor(comps, "ATK_THRESHOLD_RATIO", sourceID);
    int256 defBonus = LibBonus.getFor(comps, "DEF_THRESHOLD_RATIO", targetID);
    Shifts memory bonusEfficacyShifts = Shifts({
      base: atkBonus + defBonus,
      up: atkBonus + defBonus,
      down: atkBonus + defBonus
    });

    // sum the applied shift with the base efficacy value to get the final value
    int256 efficacy = base.toInt256();
    string memory targetAff = LibKami.getBodyAffinity(comps, targetID);
    string memory sourceAff = LibKami.getHandAffinity(comps, sourceID);
    efficacy += LibAffinity.calcEfficacyShift(
      LibAffinity.getAttackEffectiveness(sourceAff, targetAff),
      LibAffinity.getShifts(comps, "KAMI_LIQ_EFFICACY"),
      bonusEfficacyShifts
    );

    return (efficacy > 0) ? uint(efficacy) : 0;
  }

  // Calculate the liquidation HP threshold for target pet, attacked by the source pet.
  // This is measured as an absolute health value (1e0 precision).
  function calcThreshold(
    IUintComp components,
    uint256 sourceID,
    uint256 targetID
  ) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_LIQ_THRESHOLD");
    uint256 base = calcAnimosity(components, sourceID, targetID);
    uint256 ratio = calcEfficacy(components, sourceID, targetID, config[2]);

    // apply attack and defense shifts
    uint256 shiftPrec = 10 ** (ANIMOSITY_PREC + config[3] - config[5]);
    int256 shiftAttBonus = LibBonus.getFor(components, "ATK_THRESHOLD_SHIFT", sourceID);
    int256 shiftDefBonus = LibBonus.getFor(components, "DEF_THRESHOLD_SHIFT", targetID);
    int256 shift = (shiftAttBonus + shiftDefBonus) * int(shiftPrec);

    int256 postShiftVal = int(base * ratio) + shift;
    if (postShiftVal < 0) return 0;

    uint256 totalHealth = LibStat.getTotal(components, "HEALTH", targetID).toUint256();
    uint256 precision = 10 ** (ANIMOSITY_PREC + config[3] + config[7]);
    return (uint(postShiftVal) * totalHealth) / precision;
  }

  // Calculate the resulting negative karma (HP loss) from two kamis duking it out. Rounds down.
  function calcKarma(
    IUintComp components,
    uint256 sourceID,
    uint256 targetID
  ) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_LIQ_KARMA");
    int32 v2 = LibStat.getTotal(components, "VIOLENCE", targetID);
    int32 h1 = LibStat.getTotal(components, "HARMONY", sourceID);
    if (v2 - h1 < 0) return 0;

    uint256 ratio = uint(config[2]);
    uint256 precision = 10 ** uint(config[3]);
    return (uint32(v2 - h1) * ratio) / precision;
  }

  // Calculate the amount of MUSU salvaged by a target from a given balance. Round down.
  // ASSUME: config[3] >= config[1]
  function calcSalvage(
    IUintComp components,
    uint256 id, // unused atm, but will be used for skill multipliers
    uint256 amt
  ) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_LIQ_SALVAGE");
    int256 ratioBonus = LibBonus.getFor(components, "DEF_SALVAGE_RATIO", id);
    uint256 power = LibStat.getTotal(components, "POWER", id).toUint256();
    uint256 powerTuning = (config[0] + power) * 10 ** (config[3] - config[1]); // scale to Ratio precision
    uint256 ratio = config[2] + powerTuning + ratioBonus.toUint256();
    uint256 precision = 10 ** uint256(config[3]);
    return (amt * ratio) / precision;
  }

  // Calculate the reward for liquidating a specified Coin balance. Round down.
  // ASSUME: config[3] >= config[1]
  function calcSpoils(
    IUintComp components,
    uint256 id, // unused atm, but will be used for skill multipliers
    uint256 amt
  ) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_LIQ_SPOILS");
    int256 ratioBonus = LibBonus.getFor(components, "ATK_SPOILS_RATIO", id);
    uint256 power = LibStat.getTotal(components, "POWER", id).toUint256();
    uint256 powerTuning = (config[0] + power) * 10 ** (config[3] - config[1]); // scale to Ratio precision
    uint256 ratio = config[2] + powerTuning + ratioBonus.toUint256();
    uint256 precision = 10 ** uint256(config[3]);
    if (ratio / precision > 1) return amt;
    return (amt * ratio) / precision;
  }

  /////////////////
  // LOGGING

  function log(
    IWorld world,
    IUintComp components,
    uint256 accID,
    uint256 killerID,
    uint256 victimID,
    uint256 nodeID,
    KillBalance memory bals
  ) public {
    uint32 nodeIndex = LibNode.getIndex(components, nodeID);

    emitLog(components, killerID, victimID, bals, nodeIndex);

    _logKill(world, components, killerID, victimID, nodeIndex, bals);
    _logTotals(components, accID, nodeIndex);
    _logVictim(components, accID, LibKami.getAccount(components, victimID));
  }

  // creates a kill log. pretty sure we don't need to do anything with the library aside from this
  function _logKill(
    IWorld world,
    IUintComp components,
    uint256 killerID,
    uint256 victimID,
    uint32 nodeIndex,
    KillBalance memory bals
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    IsKillComponent(getAddrByID(components, IsKillCompID)).set(id);
    IdSourceComponent(getAddrByID(components, IdSourceCompID)).set(id, killerID);
    IdTargetComponent(getAddrByID(components, IdTargetCompID)).set(id, victimID);
    IndexNodeComponent(getAddrByID(components, IndexNodeCompID)).set(id, nodeIndex);
    TimeComponent(getAddrByID(components, TimeCompID)).set(id, block.timestamp);

    // set bounties
    uint32[8] memory bounties;
    bounties[0] = (bals.bounty - bals.salvage).toUint32(); // balance (negative)
    bounties[1] = bals.spoils.toUint32(); // bounty (positive)
    LibData.setArray(components, id, 0, "KILL_BOUNTIES", bounties);
  }

  function _logTotals(IUintComp components, uint256 accID, uint32 nodeIndex) internal {
    uint32[] memory indices = new uint32[](3);
    indices[1] = nodeIndex;
    string[] memory types = new string[](3);
    types[0] = "LIQUIDATE_TOTAL";
    types[1] = "LIQUIDATE_AT_NODE";
    types[2] = LibString.concat("LIQ_WHEN_", LibPhase.getName(block.timestamp));

    LibData.inc(components, accID, indices, types, 1);
  }

  function _logVictim(IUintComp components, uint256 accID, uint256 accVicID) internal {
    LibData.inc(components, accVicID, 0, "LIQUIDATED_VICTIM", 1);
    LibData.inc(components, accID, LibAccount.getIndex(components, accVicID), "LIQ_TARGET_ACC", 1);
  }

  function calculateHealthValues(
    IUintComp components,
    uint256 kamiID
  ) internal view returns (int32, int32) {
    Stat memory hp = LibStat.get(components, "HEALTH", kamiID);
    return (hp.sync, LibStat.calcTotal(hp));
  }

  function emitLog(
    IUintComp components,
    uint256 killerID,
    uint256 victimID,
    KillBalance memory bals,
    uint32 nodeIndex
  ) internal {
    // Combine health calculations into structs to reduce stack variables
    (int32 killerHealthSync, int32 killerHealthTotal) = calculateHealthValues(components, killerID);
    (int32 victimHealthSync, int32 victimHealthTotal) = calculateHealthValues(components, victimID);

    // Combine balance conversion into uint32 before the emit to reduce stack usage
    uint32 bounty = bals.bounty.toUint32();
    uint32 salvage = bals.salvage.toUint32();
    uint32 spoils = bals.spoils.toUint32();
    uint32 strain = bals.strain.toUint32();
    uint32 karma = bals.karma.toUint32();

    emit KamiLiquidated(
      block.timestamp.toUint64(),
      nodeIndex,
      LibKami.getIndex(components, killerID),
      killerHealthSync,
      killerHealthTotal,
      LibKami.getIndex(components, victimID),
      victimHealthSync,
      victimHealthTotal,
      bounty,
      salvage,
      spoils,
      strain,
      karma
    );
  }
}
