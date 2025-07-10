// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { FixedPointMathLib as LibFPMath } from "solady/utils/FixedPointMathLib.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibTypes } from "solecs/LibTypes.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibAffinity, Shifts } from "libraries/utils/LibAffinity.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibData } from "libraries/LibData.sol";
import { LibEmitter } from "libraries/utils/LibEmitter.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibHarvest } from "libraries/LibHarvest.sol";
import { LibInventory, MUSU_INDEX } from "libraries/LibInventory.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibPhase } from "libraries/utils/LibPhase.sol";
import { LibStat, Stat } from "libraries/LibStat.sol";
import { Gaussian } from "utils/Gaussian.sol";

uint256 constant ANIMOSITY_PREC = 6;

struct KillLog {
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

  /////////////////
  // INTERACTIONS

  /// @notice send salvage back to victim's owner
  function sendSalvage(IUintComp comps, uint256 victimID, uint256 amt) internal {
    if (amt == 0) return;
    uint256 accID = LibKami.getAccount(comps, victimID);
    LibInventory.incFor(comps, accID, MUSU_INDEX, amt);
    LibExperience.inc(comps, victimID, amt);
  }

  /// @notice send spoils to killer's owner
  function sendSpoils(IUintComp comps, uint256 killerProdID, uint256 amt) internal {
    if (amt == 0) return;
    LibHarvest.incBounty(comps, killerProdID, amt);
  }

  /////////////////
  // CHECKERS

  // Check whether the source pet can liquidate the target harvest, based on pet stats.
  // NOTE: this asssumes that both the source and target pet's health has been synced in
  // this block and that the source can attack the target.
  function isLiquidatableBy(
    IUintComp comps,
    uint256 targetKamiID,
    uint256 sourceKamiID
  ) public view returns (bool) {
    uint256 currHealth = LibStat.getCurrent(comps, "HEALTH", targetKamiID).toUint256();
    uint256 threshold = calcThreshold(comps, sourceKamiID, targetKamiID);
    return threshold > currHealth;
  }

  /////////////////
  // CALCULATIONS

  /// @notice Calculate the base liquidation threshold % for target pet when attacked by source pet.
  // H = Φ(ln(v_s / h_t)) * ratio  as proportion of total health (1e6 precision).
  function calcAnimosity(
    IUintComp comps,
    uint256 sourceID,
    uint256 targetID
  ) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(comps, "KAMI_LIQ_ANIMOSITY");

    uint256 sourceViolence = LibStat.getTotal(comps, "VIOLENCE", sourceID).toUint256();
    uint256 targetHarmony = LibStat.getTotal(comps, "HARMONY", targetID).toUint256();
    int256 imbalance = ((1e18 * sourceViolence) / targetHarmony).toInt256();
    uint256 base = Gaussian.cdf(LibFPMath.lnWad(imbalance)).toUint256();
    uint256 ratio = config[2]; // core animosity baseline

    // flipped precision as inputs are more precise than output
    uint256 precision = 10 ** (18 + config[3] - ANIMOSITY_PREC);
    return (base * ratio) / precision;
  }

  /// @notice Calculate the affinity multiplier for attacks between two kamis.
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

  /// @notice Calculate the liquidation HP threshold for target pet, attacked by the source pet.
  // This is measured as an absolute health value (1e0 precision).
  function calcThreshold(
    IUintComp comps,
    uint256 sourceID,
    uint256 targetID
  ) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(comps, "KAMI_LIQ_THRESHOLD");
    uint256 base = calcAnimosity(comps, sourceID, targetID);
    uint256 ratio = calcEfficacy(comps, sourceID, targetID, config[2]);

    // apply attack and defense shifts
    uint256 shiftPrec = 10 ** (ANIMOSITY_PREC + config[3] - config[5]);
    int256 shiftAttBonus = LibBonus.getFor(comps, "ATK_THRESHOLD_SHIFT", sourceID);
    int256 shiftDefBonus = LibBonus.getFor(comps, "DEF_THRESHOLD_SHIFT", targetID);
    int256 shift = (shiftAttBonus + shiftDefBonus) * int256(shiftPrec);

    int256 postShiftVal = int256(base * ratio) + shift;
    if (postShiftVal < 0) return 0;

    uint256 totalHealth = LibStat.getTotal(comps, "HEALTH", targetID).toUint256();
    uint256 precision = 10 ** (ANIMOSITY_PREC + config[3] + config[7]);
    return (uint(postShiftVal) * totalHealth) / precision;
  }

  /// @notice Calculate the resulting negative karma (HP loss) from two kamis duking it out. Rounds down.
  function calcKarma(
    IUintComp comps,
    uint256 sourceID,
    uint256 targetID
  ) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(comps, "KAMI_LIQ_KARMA");
    int32 v2 = LibStat.getTotal(comps, "VIOLENCE", targetID);
    int32 h1 = LibStat.getTotal(comps, "HARMONY", sourceID);
    int32 nudge = config[0].toInt32(); // assumed 0 precision
    if (nudge + v2 - h1 < 0) return 0;

    uint256 boost = uint256(config[6]);
    uint256 precision = 10 ** uint256(config[7]);
    return (uint32(nudge + v2 - h1) * boost) / precision;
  }

  /// @notice Calculate the total resulting HP damage from a liquidation
  function calcRecoil(
    IUintComp comps,
    uint256 sourceID,
    uint256 strain,
    uint256 karma
  ) internal view returns (int32) {
    uint32[8] memory config = LibConfig.getArray(comps, "KAMI_LIQ_RECOIL");
    int256 boostBonus = LibBonus.getFor(comps, "ATK_RECOIL_BOOST", sourceID);
    uint256 ratio = config[2];
    uint256 core = strain * ratio + karma * 10 ** uint256(config[3]); // scale karma (shift) by the precision of the ratio
    uint256 boost = (config[6].toInt256() + boostBonus).toUint256(); // need to be wary here of negative values

    uint256 precision = 10 ** uint256(config[3] + config[7]);
    return ((core * boost) / precision).toInt32();
  }

  /// @notice Calculate the amount of MUSU salvaged by a target from a given balance. Round down.
  // ASSUME: config[3] >= config[1]
  function calcSalvage(
    IUintComp comps,
    uint256 id, // unused atm, but will be used for skill multipliers
    uint256 amt
  ) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(comps, "KAMI_LIQ_SALVAGE");
    int256 ratioBonus = LibBonus.getFor(comps, "DEF_SALVAGE_RATIO", id);
    uint256 power = LibStat.getTotal(comps, "POWER", id).toUint256();
    uint256 powerTuning = (config[0] + power) * 10 ** (config[3] - config[1]); // scale to Ratio precision
    uint256 ratio = config[2] + powerTuning + ratioBonus.toUint256();
    uint256 precision = 10 ** uint256(config[3]);
    return (amt * ratio) / precision;
  }

  /// @notice Calculate the reward for liquidating a specified Coin balance. Round down.
  // ASSUME: config[3] >= config[1]
  function calcSpoils(
    IUintComp comps,
    uint256 id, // unused atm, but will be used for skill multipliers
    uint256 amt
  ) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(comps, "KAMI_LIQ_SPOILS");
    int256 ratioBonus = LibBonus.getFor(comps, "ATK_SPOILS_RATIO", id);
    uint256 power = LibStat.getTotal(comps, "POWER", id).toUint256();
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
    IUintComp comps,
    uint256 accID,
    uint256 killerID,
    uint256 victimID,
    uint256 nodeID,
    KillLog memory bals
  ) public {
    uint32 nodeIndex = LibNode.getIndex(comps, nodeID);
    _logTotals(comps, accID, nodeIndex);
    _logVictim(comps, accID, LibKami.getAccount(comps, victimID));
    emitLog(world, comps, accID, killerID, victimID, bals, nodeIndex);
  }

  // data log the bounty to.. something
  // NOTE: not used atm. needs to be updated to use
  function _logBounty(
    IWorld world,
    IUintComp comps,
    KillLog memory bals
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    uint32[8] memory bounties;
    bounties[0] = (bals.bounty - bals.salvage).toUint32(); // balance (negative)
    bounties[1] = bals.spoils.toUint32(); // bounty (positive)
    LibData.setArray(comps, id, 0, "KILL_BOUNTIES", bounties);
  }

  function _logTotals(IUintComp comps, uint256 accID, uint32 nodeIndex) internal {
    uint32[] memory indices = new uint32[](3);
    indices[1] = nodeIndex;
    string[] memory types = new string[](3);
    types[0] = "LIQUIDATE_TOTAL";
    types[1] = "LIQUIDATE_AT_NODE";
    types[2] = LibString.concat("LIQ_WHEN_", LibPhase.getName(block.timestamp));

    LibData.inc(comps, accID, indices, types, 1);
  }

  function _logVictim(IUintComp comps, uint256 accID, uint256 accVicID) internal {
    LibData.inc(comps, accVicID, 0, "LIQUIDATED_VICTIM", 1);
    LibData.inc(comps, accID, LibAccount.getIndex(comps, accVicID), "LIQ_TARGET_ACC", 1);
  }

  function calculateHealthValues(
    IUintComp comps,
    uint256 kamiID
  ) internal view returns (int32, int32) {
    Stat memory hp = LibStat.get(comps, "HEALTH", kamiID);
    return (hp.sync, LibStat.calcTotal(hp));
  }

  function emitLog(
    IWorld world,
    IUintComp comps,
    uint256 accID,
    uint256 killerID,
    uint256 victimID,
    KillLog memory bals,
    uint32 nodeIndex
  ) internal {
    KillEventData memory eventData;

    // Fill basic data
    eventData.accID = accID;
    eventData.nodeIndex = nodeIndex;

    // Get health and indices
    (eventData.killerHealthSync, eventData.killerHealthTotal) = calculateHealthValues(
      comps,
      killerID
    );
    (eventData.victimHealthSync, eventData.victimHealthTotal) = calculateHealthValues(
      comps,
      victimID
    );
    eventData.killerID = killerID;
    eventData.victimID = victimID;

    // Convert balances
    eventData.bounty = bals.bounty;
    eventData.salvage = bals.salvage;
    eventData.spoils = bals.spoils;

    bytes memory encoded = _encodeKillEvent(eventData);

    LibEmitter.emitEvent(world, "KILL", _schema(), encoded);
  }

  function _schema() internal pure returns (uint8[] memory) {
    uint8[] memory schema = new uint8[](12);
    schema[0] = uint8(LibTypes.SchemaValue.UINT256);
    schema[1] = uint8(LibTypes.SchemaValue.UINT256);
    schema[2] = uint8(LibTypes.SchemaValue.UINT32);
    schema[3] = uint8(LibTypes.SchemaValue.UINT256);
    schema[4] = uint8(LibTypes.SchemaValue.INT32);
    schema[5] = uint8(LibTypes.SchemaValue.INT32);
    schema[6] = uint8(LibTypes.SchemaValue.UINT256);
    schema[7] = uint8(LibTypes.SchemaValue.INT32);
    schema[8] = uint8(LibTypes.SchemaValue.INT32);
    schema[9] = uint8(LibTypes.SchemaValue.UINT256);
    schema[10] = uint8(LibTypes.SchemaValue.UINT256);
    schema[11] = uint8(LibTypes.SchemaValue.UINT256);
    return schema;
  }

  struct KillEventData {
    uint256 accID;
    uint256 timestamp;
    uint32 nodeIndex;
    uint256 killerID;
    int32 killerHealthSync;
    int32 killerHealthTotal;
    uint256 victimID;
    int32 victimHealthSync;
    int32 victimHealthTotal;
    uint256 bounty;
    uint256 salvage;
    uint256 spoils;
  }

  function _encodeKillEvent(KillEventData memory data) internal view returns (bytes memory) {
    return
      abi.encode(
        data.accID,
        block.timestamp,
        data.nodeIndex,
        data.killerID,
        data.killerHealthSync,
        data.killerHealthTotal,
        data.victimID,
        data.victimHealthSync,
        data.victimHealthTotal,
        data.bounty,
        data.salvage,
        data.spoils
      );
  }
}
