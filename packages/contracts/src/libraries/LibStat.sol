// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { Stat, StatLib } from "solecs/components/types/Stat.sol";

import { StatComponent } from "solecs/components/StatComponent.sol";
import { HealthComponent, ID as HealthCompID } from "components/HealthComponent.sol";
import { HarmonyComponent, ID as HarmonyCompID } from "components/HarmonyComponent.sol";
import { PowerComponent, ID as PowerCompID } from "components/PowerComponent.sol";
import { SlotsComponent, ID as SlotsCompID } from "components/SlotsComponent.sol";
import { StaminaComponent, ID as StaminaCompID } from "components/StaminaComponent.sol";
import { ViolenceComponent, ID as ViolenceCompID } from "components/ViolenceComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibBonus } from "libraries/LibBonus.sol";

// LibStat manages the retrieval and update of stats. This library differs from
// others in the sense that it does not manage a single entity type, but rather
// any entity that can have stats. Only handles StatComponents.
library LibStat {
  using LibComp for StatComponent;
  using LibString for string;
  using SafeCastLib for int256;

  /////////////////
  // INTERACTIONS

  /// @notice sets the sync value of a stat while accounting for bonuses
  function sync(
    IUintComp components,
    string memory type_,
    int32 amt,
    uint256 id
  ) internal returns (int32) {
    StatComponent statComp = getStatComp(components, type_);
    Stat memory base = statComp.safeGet(id);
    Stat memory withBonus = add(base, getBonuses(components, type_, id));

    // sync with total bonus applied, but don't edit any other base stat
    base.sync = calcSync(calcTotal(withBonus), base.sync, amt);

    statComp.set(id, base);
    return base.sync;
  }

  /// @notice Apply the set stats from one entity to another
  /// @dev we do not ever expect Base to be set for a consumable
  function applyAll(IUintComp components, uint256 deltaID, uint256 baseID) internal {
    uint256[] memory compIDs = getStatCompIDs();
    for (uint256 i = 0; i < compIDs.length; i++)
      applySingle(components, compIDs[i], deltaID, baseID);
  }

  // apply the delta of stat changes to base
  function applySingle(
    IUintComp components,
    uint256 statCompID,
    uint256 deltaID,
    uint256 baseID
  ) internal {
    StatComponent statComp = StatComponent(getAddrByID(components, statCompID));
    Stat memory delta = statComp.safeGet(deltaID);
    if (StatLib.isZero(delta)) return; // nothing to apply

    Stat memory baseStat = statComp.safeGet(baseID);
    Stat memory result = add(baseStat, delta);

    // syncing
    if (delta.sync > 0) {
      Stat memory withBonus = add(result, getBonuses(components, compIDToType(statCompID), baseID));
      result.sync = calcSync(calcTotal(withBonus), result.sync, 0);
    }

    statComp.set(baseID, result);
  }

  // Copy the set stats from one entity to another.
  function copy(IUintComp components, uint256 fromID, uint256 toID) internal {
    uint256[] memory compIDs = getStatCompIDs();
    for (uint256 i = 0; i < compIDs.length; i++) {
      StatComponent statComp = StatComponent(getAddrByID(components, compIDs[i]));
      Stat memory fromStat = statComp.safeGet(fromID);
      if (!StatLib.isZero(fromStat)) statComp.set(toID, fromStat);
    }
  }

  // Wipe all set stats from an entity.
  function wipe(IUintComp components, uint256 id) internal {
    uint256[] memory compIDs = getStatCompIDs();
    for (uint256 i = 0; i < compIDs.length; i++) getCompByID(components, compIDs[i]).remove(id);
  }

  /////////////////
  // CALCULATIONS

  function calcTotal(Stat memory value) internal pure returns (int32) {
    int32 total = ((1e3 + value.boost) * (value.base + value.shift)) / 1e3;
    return (total > 0) ? total : int32(0);
  }

  function calcSync(int32 max, int32 curr, int32 delta) internal pure returns (int32 syncResult) {
    syncResult = curr + delta;
    if (syncResult < 0) syncResult = 0;
    else if (syncResult > max) syncResult = max;
  }

  /////////////////
  // GETTERS

  function get(
    IUintComp components,
    string memory type_,
    uint256 id
  ) internal view returns (Stat memory) {
    return get(components, getStatComp(components, type_), type_, id);
  }

  function get(
    IUintComp components,
    StatComponent statComp,
    string memory type_,
    uint256 id
  ) internal view returns (Stat memory) {
    Stat memory base = statComp.safeGet(id);
    return add(base, getBonuses(components, type_, id));
  }

  function getTotal(
    IUintComp components,
    string memory type_,
    uint256 id
  ) internal view returns (int32) {
    return calcTotal(get(components, type_, id));
  }

  /// @notice gets current value (sync)
  /// @dev must be called after syncing. does not query bonus
  function getCurrent(
    IUintComp components,
    string memory type_,
    uint256 id
  ) internal view returns (int32) {
    return getStatComp(components, type_).safeGet(id).sync;
  }

  function getWithoutBonus(
    IUintComp components,
    string memory type_,
    uint256 id
  ) internal view returns (Stat memory) {
    return getStatComp(components, type_).safeGet(id);
  }

  function getBonuses(
    IUintComp components,
    string memory type_,
    uint256 id
  ) internal view returns (Stat memory) {
    return Stat(0, getShiftBonus(components, type_, id), getBoostBonus(components, type_, id), 0);
  }

  function getShiftBonus(
    IUintComp components,
    string memory type_,
    uint256 id
  ) internal view returns (int32) {
    return
      LibBonus.getFor(components, string("STAT_").concat(type_).concat("_SHIFT"), id).toInt32();
  }

  function getBoostBonus(
    IUintComp components,
    string memory type_,
    uint256 id
  ) internal view returns (int32) {
    return
      LibBonus.getFor(components, string("STAT_").concat(type_).concat("_BOOST"), id).toInt32();
  }

  function getStatCompIDs() internal pure returns (uint256[] memory) {
    uint256[] memory compIDs = new uint256[](6);
    compIDs[0] = HealthCompID;
    compIDs[1] = HarmonyCompID;
    compIDs[2] = PowerCompID;
    compIDs[3] = SlotsCompID;
    compIDs[4] = StaminaCompID;
    compIDs[5] = ViolenceCompID;
    return compIDs;
  }

  /////////////////
  // SETTERS

  // note: setting sync manually for any non-zero value breaks abstraction
  function setSyncZero(IUintComp components, string memory type_, uint256 id) internal {
    Stat memory stat = getWithoutBonus(components, type_, id);
    stat.sync = 0;
    getStatComp(components, type_).set(id, stat);
  }

  // set the harmony stat struct of an entity
  function setHarmony(IUintComp components, uint256 id, Stat memory value) internal {
    HarmonyComponent(getAddrByID(components, HarmonyCompID)).set(id, value);
  }

  // set the health stat struct of an entity
  function setHealth(IUintComp components, uint256 id, Stat memory value) internal {
    HealthComponent(getAddrByID(components, HealthCompID)).set(id, value);
  }

  // set the power stat struct of an entity
  function setPower(IUintComp components, uint256 id, Stat memory value) internal {
    PowerComponent(getAddrByID(components, PowerCompID)).set(id, value);
  }

  // set the slots stat struct of an entity
  function setSlots(IUintComp components, uint256 id, Stat memory value) internal {
    SlotsComponent(getAddrByID(components, SlotsCompID)).set(id, value);
  }

  // set the stamina stat struct of an entity
  function setStamina(IUintComp components, uint256 id, Stat memory value) internal {
    StaminaComponent(getAddrByID(components, StaminaCompID)).set(id, value);
  }

  // set the violence stat struct of an entity
  function setViolence(IUintComp components, uint256 id, Stat memory value) internal {
    ViolenceComponent(getAddrByID(components, ViolenceCompID)).set(id, value);
  }

  /////////////////
  // UNSETTERS

  function unsetHarmony(IUintComp components, uint256 id) internal {
    getCompByID(components, HarmonyCompID).remove(id);
  }

  function unsetHealth(IUintComp components, uint256 id) internal {
    getCompByID(components, HealthCompID).remove(id);
  }

  function unsetPower(IUintComp components, uint256 id) internal {
    getCompByID(components, PowerCompID).remove(id);
  }

  function unsetSlots(IUintComp components, uint256 id) internal {
    getCompByID(components, SlotsCompID).remove(id);
  }

  function unsetStamina(IUintComp components, uint256 id) internal {
    getCompByID(components, StaminaCompID).remove(id);
  }

  function unsetViolence(IUintComp components, uint256 id) internal {
    getCompByID(components, ViolenceCompID).remove(id);
  }

  ////////////////////
  // UTILS

  /// @dev base is never expected to change
  function add(Stat memory base, Stat memory toAdd) internal pure returns (Stat memory) {
    return
      Stat(base.base, base.shift + toAdd.shift, base.boost + toAdd.boost, base.sync + toAdd.sync);
  }

  function typeToCompID(string memory type_) internal pure returns (uint256) {
    if (LibString.eq(type_, "HEALTH")) return HealthCompID;
    if (LibString.eq(type_, "POWER")) return PowerCompID;
    if (LibString.eq(type_, "HARMONY")) return HarmonyCompID;
    if (LibString.eq(type_, "VIOLENCE")) return ViolenceCompID;
    if (LibString.eq(type_, "SLOTS")) return SlotsCompID;
    if (LibString.eq(type_, "STAMINA")) return StaminaCompID;
    revert("LibStat: invalid stat type");
  }

  // tbh kill me this is a mess get rid of it soon tm
  function compIDToType(uint256 compID) internal pure returns (string memory) {
    if (compID == HealthCompID) return "HEALTH";
    if (compID == PowerCompID) return "POWER";
    if (compID == HarmonyCompID) return "HARMONY";
    if (compID == ViolenceCompID) return "VIOLENCE";
    if (compID == SlotsCompID) return "SLOTS";
    if (compID == StaminaCompID) return "STAMINA";
    revert("LibStat: invalid stat type");
  }

  function getStatComp(
    IUintComp components,
    string memory type_
  ) internal view returns (StatComponent) {
    return StatComponent(getAddrByID(components, typeToCompID(type_)));
  }
}
