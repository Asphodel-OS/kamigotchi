// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { FixedPointMathLib as LibFPMath } from "solady/utils/FixedPointMathLib.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { IdNodeComponent, ID as IdNodeCompID } from "components/IdNodeComponent.sol";
import { IdSourceComponent, ID as IdSourceCompID } from "components/IdSourceComponent.sol";
import { IdTargetComponent, ID as IdTargetCompID } from "components/IdTargetComponent.sol";
import { IndexNodeComponent, ID as IndexNodeCompID } from "components/IndexNodeComponent.sol";
import { IsKillComponent, ID as IsKillCompID } from "components/IsKillComponent.sol";
import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { CoinComponent, ID as CoinCompID } from "components/CoinComponent.sol";
import { TimeComponent, ID as TimeCompID } from "components/TimeComponent.sol";
import { LibAffinity } from "libraries/LibAffinity.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibPet } from "libraries/LibPet.sol";
import { Gaussian } from "utils/Gaussian.sol";

uint256 constant ANIMOSITY_PREC = 6;

// LibKill does maths for liquidation calcs and handles creation of kill logs,
// which track when, where and with whom a murder took place.
library LibKill {
  using LibFPMath for int256;
  using SafeCastLib for int32;
  using SafeCastLib for uint32;
  using SafeCastLib for int256;
  using SafeCastLib for uint256;

  // creates a kill log. pretty sure we don't need to do anything with the library aside from this
  function create(
    IWorld world,
    IUintComp components,
    uint256 sourceID,
    uint256 targetID,
    uint256 nodeID,
    uint256 balance,
    uint256 bounty
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsKillComponent(getAddressById(components, IsKillCompID)).set(id);
    IdSourceComponent(getAddressById(components, IdSourceCompID)).set(id, sourceID);
    IdTargetComponent(getAddressById(components, IdTargetCompID)).set(id, targetID);
    IdNodeComponent(getAddressById(components, IdNodeCompID)).set(id, nodeID);
    IndexNodeComponent(getAddressById(components, IndexNodeCompID)).set(
      id,
      LibNode.getIndex(components, nodeID)
    );

    BalanceComponent(getAddressById(components, BalanceCompID)).set(id, balance);
    CoinComponent(getAddressById(components, CoinCompID)).set(id, bounty);
    TimeComponent(getAddressById(components, TimeCompID)).set(id, block.timestamp);
    return id;
  }

  /////////////////
  // CALCULATIONS

  // Calculate the affinity multiplier for attacks between two kamis.
  // We really need to overload the word 'base' a bit less..
  function calcEfficacy(
    IUintComp components,
    uint256 sourceID,
    uint256 targetID,
    uint256 base
  ) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_LIQ_EFFICACY");

    // pull the base efficacy shifts from the config
    LibAffinity.Shifts memory baseEfficacyShifts = LibAffinity.Shifts({
      base: config[0].toInt256(),
      up: config[1].toInt256(),
      down: -1 * config[2].toInt256() // configs unable to support negative values
    });

    // pull the bonus efficacy shifts from the pets
    int256 atkBonus = LibBonus.getRaw(components, sourceID, "ATK_THRESHOLD_RATIO");
    int256 defBonus = LibBonus.getRaw(components, targetID, "DEF_THRESHOLD_RATIO");
    LibAffinity.Shifts memory bonusEfficacyShifts = LibAffinity.Shifts({
      base: int(0),
      up: atkBonus + defBonus,
      down: int(0)
    });

    // sum the applied shift with the base efficacy value to get the final value
    int256 efficacy = base.toInt256();
    string memory targetAff = LibPet.getAffinities(components, targetID)[0];
    string memory sourceAff = LibPet.getAffinities(components, sourceID)[1];
    efficacy += LibAffinity.calcEfficacyShift(
      LibAffinity.getAttackEffectiveness(sourceAff, targetAff),
      baseEfficacyShifts,
      bonusEfficacyShifts
    );

    return (efficacy > 0) ? uint(efficacy) : 0;
  }

  // Calculate the base liquidation threshold % for target pet when attacked by source pet.
  // H = Φ(ln(v_s / h_t)) * ratio  as proportion of total health (1e6 precision).
  function calcAnimosity(
    IUintComp components,
    uint256 sourceID,
    uint256 targetID
  ) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_LIQ_ANIMOSITY");

    uint256 sourceViolence = LibPet.calcTotalViolence(components, sourceID).toUint256();
    uint256 targetHarmony = LibPet.calcTotalHarmony(components, targetID).toUint256();
    int256 imbalance = ((1e18 * sourceViolence) / targetHarmony).toInt256();
    uint256 base = Gaussian.cdf(LibFPMath.lnWad(imbalance)).toUint256();
    uint256 ratio = config[2]; // core animosity baseline

    // flipped precision as inputs are more precise than output
    uint256 precision = 10 ** (18 + config[3] - ANIMOSITY_PREC);
    return (base * ratio) / precision;
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
    int256 shiftAttBonus = LibBonus.getRaw(components, sourceID, "ATK_THRESHOLD_SHIFT");
    int256 shiftDefBonus = LibBonus.getRaw(components, targetID, "DEF_THRESHOLD_SHIFT");
    int256 shift = (shiftAttBonus + shiftDefBonus) * int(shiftPrec);

    int256 postShiftVal = int(base * ratio) + shift;
    if (postShiftVal < 0) return 0;

    uint256 totalHealth = LibPet.calcTotalHealth(components, targetID).toUint256();
    uint256 precision = 10 ** (ANIMOSITY_PREC + config[3] + config[7]);
    return (uint(postShiftVal) * totalHealth) / precision;
  }

  function calcSalvage(
    IUintComp components,
    uint256 id, // unused atm, but will be used for skill multipliers
    uint256 amt
  ) internal view returns (uint256) {
    uint32[8] memory configVals = LibConfig.getArray(components, "KAMI_LIQ_SALVAGE");
    int256 ratioBonus = LibBonus.getRaw(components, id, "DEF_SALVAGE_RATIO");
    uint256 ratio = configVals[2] + ratioBonus.toUint256();
    uint256 precision = 10 ** uint256(configVals[3]);
    return (amt * ratio) / precision;
  }

  // Calculate the reward for liquidating a specified Coin balance
  function calcSpoils(
    IUintComp components,
    uint256 id, // unused atm, but will be used for skill multipliers
    uint256 amt
  ) internal view returns (uint256) {
    uint32[8] memory configVals = LibConfig.getArray(components, "KAMI_LIQ_SPOILS");
    int256 ratioBonus = LibBonus.getRaw(components, id, "ATK_SPOILS_RATIO");
    uint256 ratio = configVals[2] + ratioBonus.toUint256();
    uint256 precision = 10 ** uint256(configVals[3]);
    return (amt * ratio) / precision;
  }
}
