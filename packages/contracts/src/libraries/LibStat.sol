// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
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

// LibStat manages the retrieval and update of stats. This library differs from
// others in the sense that it does not manage a single entity type, but rather
// any entity that can have stats. Only handles StatComponents.
library LibStat {
  using LibComp for StatComponent;

  /////////////////
  // INTERACTIONS

  /// @notice Apply the set stats from one entity to another
  /// @dev we do not ever expect Base to be set for a consumable
  function applyAll(IUintComp components, uint256 fromID, uint256 toID) internal {
    uint256[] memory compIDs = getStatCompIDs();
    for (uint256 i = 0; i < compIDs.length; i++)
      applySingle(StatComponent(getAddrByID(components, compIDs[i])), fromID, toID);
  }

  function applySingle(StatComponent statComp, uint256 fromID, uint256 toID) internal {
    Stat memory fromStat = statComp.safeGet(fromID);
    if (StatLib.isZero(fromStat)) return; // nothing to apply

    Stat memory toStat = statComp.safeGet(toID);
    statComp.set(toID, add(fromStat, toStat));
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

  // adjust the shift field of a specified stat type
  function shift(
    IUintComp components,
    uint256 id,
    string memory type_,
    int32 amt
  ) internal returns (int32) {
    return getStatComponent(components, type_).shift(id, amt);
  }

  // adjust the multiplier field of a specified stat type (1e3 decimals of precision)
  function boost(
    IUintComp components,
    uint256 id,
    string memory type_,
    int32 amt
  ) internal returns (int32) {
    return getStatComponent(components, type_).boost(id, amt);
  }

  /////////////////
  // CALCULATIONS

  /// @notice Add two stats together
  /// @dev we do not ever expect Base change
  function add(Stat memory fromStat, Stat memory toStat) internal pure returns (Stat memory) {
    Stat memory result = toStat;
    result.shift += fromStat.shift;
    result.boost += fromStat.boost;
    if (fromStat.sync > 0) {
      int32 max = StatLib.calcTotal(result);
      result.sync = StatLib.sync(result, fromStat.sync, max);
    }
    return result;
  }

  /// @notice syncs a Stat, but allow for negative value
  /// @dev used for 0 check; do add 0 check for write
  function syncSigned(Stat memory stat, int32 amt) internal pure returns (int32) {
    int32 result = stat.sync + amt;
    int32 max = StatLib.calcTotal(stat);
    if (result > max) return max;
    return result;
  }

  /////////////////
  // GETTERS

  function getHarmony(IUintComp components, uint256 id) internal view returns (Stat memory) {
    return StatComponent(getAddrByID(components, HarmonyCompID)).safeGet(id);
  }

  function getHarmonyTotal(IUintComp components, uint256 id) internal view returns (int32) {
    return StatComponent(getAddrByID(components, HarmonyCompID)).calcTotal(id);
  }

  function getHealth(IUintComp components, uint256 id) internal view returns (Stat memory) {
    return StatComponent(getAddrByID(components, HealthCompID)).safeGet(id);
  }

  function getHealthTotal(IUintComp components, uint256 id) internal view returns (int32) {
    return StatComponent(getAddrByID(components, HealthCompID)).calcTotal(id);
  }

  function getPower(IUintComp components, uint256 id) internal view returns (Stat memory) {
    return StatComponent(getAddrByID(components, PowerCompID)).safeGet(id);
  }

  function getPowerTotal(IUintComp components, uint256 id) internal view returns (int32) {
    return StatComponent(getAddrByID(components, PowerCompID)).calcTotal(id);
  }

  function getSlots(IUintComp components, uint256 id) internal view returns (Stat memory) {
    return StatComponent(getAddrByID(components, SlotsCompID)).safeGet(id);
  }

  function getSlotsTotal(IUintComp components, uint256 id) internal view returns (int32) {
    return StatComponent(getAddrByID(components, SlotsCompID)).calcTotal(id);
  }

  function getStamina(IUintComp components, uint256 id) internal view returns (Stat memory) {
    return StatComponent(getAddrByID(components, StaminaCompID)).safeGet(id);
  }

  function getStaminaTotal(IUintComp components, uint256 id) internal view returns (int32) {
    return StatComponent(getAddrByID(components, StaminaCompID)).calcTotal(id);
  }

  function getViolence(IUintComp components, uint256 id) internal view returns (Stat memory) {
    return StatComponent(getAddrByID(components, ViolenceCompID)).safeGet(id);
  }

  function getViolenceTotal(IUintComp components, uint256 id) internal view returns (int32) {
    return StatComponent(getAddrByID(components, ViolenceCompID)).calcTotal(id);
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
  // COMPONENT GETTERS

  function getStatComponent(
    IUintComp components,
    string memory type_
  ) public view returns (StatComponent) {
    if (LibString.eq(type_, "HEALTH"))
      return HealthComponent(getAddrByID(components, HealthCompID));
    if (LibString.eq(type_, "POWER")) return PowerComponent(getAddrByID(components, PowerCompID));
    if (LibString.eq(type_, "HARMONY"))
      return HarmonyComponent(getAddrByID(components, HarmonyCompID));
    if (LibString.eq(type_, "VIOLENCE"))
      return ViolenceComponent(getAddrByID(components, ViolenceCompID));
    if (LibString.eq(type_, "SLOTS")) return SlotsComponent(getAddrByID(components, SlotsCompID));
    if (LibString.eq(type_, "STAMINA"))
      return StaminaComponent(getAddrByID(components, StaminaCompID));
    revert("LibStat: invalid stat type");
  }
}
