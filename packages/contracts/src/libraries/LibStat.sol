// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { Stat, StatComponent } from "components/types/StatComponent.sol";
import { HealthComponent, ID as HealthCompID } from "components/HealthComponent.sol";
import { HarmonyComponent, ID as HarmonyCompID } from "components/HarmonyComponent.sol";
import { PowerComponent, ID as PowerCompID } from "components/PowerComponent.sol";
import { SlotsComponent, ID as SlotsCompID } from "components/SlotsComponent.sol";
import { StaminaComponent, ID as StaminaCompID } from "components/StaminaComponent.sol";
import { ViolenceComponent, ID as ViolenceCompID } from "components/ViolenceComponent.sol";

// LibStat manages the retrieval and update of stats. This library differs from
// others in the sense that it does not manage a single entity type, but rather
// any entity that can have stats. Only handles StatComponents.
library LibStat {
  /////////////////
  // INTERACTIONS

  // Copy the set stats from one entity to another.
  function copy(IUintComp components, uint256 fromID, uint256 toID) internal {
    uint256[] memory componentIDs = getComponentsSet(components, fromID);
    for (uint256 i = 0; i < componentIDs.length; i++) {
      uint256 val = IUintComp(getAddressById(components, componentIDs[i])).get(fromID);
      IUintComp(getAddressById(components, componentIDs[i])).set(toID, val);
    }
  }

  // Wipe all set stats from an entity.
  function wipe(IUintComp components, uint256 id) internal {
    uint256[] memory componentIDs = getComponentsSet(components, id);
    for (uint256 i = 0; i < componentIDs.length; i++) {
      getComponentById(components, componentIDs[i]).remove(id);
    }
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

  // Get all the component IDs of an entity's set stats. Slots Component is included
  // with upgradable equipment in mind.
  // NOTE: rarity is included for the sake of completeness but is not strictly needed
  function getComponentsSet(
    IUintComp components,
    uint256 id
  ) internal view returns (uint256[] memory) {
    uint256 statCount;
    if (hasPower(components, id)) statCount++;
    if (hasHealth(components, id)) statCount++;
    if (hasHarmony(components, id)) statCount++;
    if (hasViolence(components, id)) statCount++;
    if (hasSlots(components, id)) statCount++;
    if (hasStamnina(components, id)) statCount++;

    uint256 i;
    uint256[] memory statComponents = new uint256[](statCount);
    if (hasPower(components, id)) statComponents[i++] = PowerCompID;
    if (hasHealth(components, id)) statComponents[i++] = HealthCompID;
    if (hasHarmony(components, id)) statComponents[i++] = HarmonyCompID;
    if (hasViolence(components, id)) statComponents[i++] = ViolenceCompID;
    if (hasSlots(components, id)) statComponents[i++] = SlotsCompID;
    if (hasStamnina(components, id)) statComponents[i++] = StaminaCompID;
    return statComponents;
  }

  /////////////////
  // CHECKERS

  function hasHarmony(IUintComp components, uint256 id) internal view returns (bool) {
    return HarmonyComponent(getAddressById(components, HarmonyCompID)).has(id);
  }

  function hasHealth(IUintComp components, uint256 id) internal view returns (bool) {
    return HealthComponent(getAddressById(components, HealthCompID)).has(id);
  }

  function hasPower(IUintComp components, uint256 id) internal view returns (bool) {
    return PowerComponent(getAddressById(components, PowerCompID)).has(id);
  }

  function hasSlots(IUintComp components, uint256 id) internal view returns (bool) {
    return SlotsComponent(getAddressById(components, SlotsCompID)).has(id);
  }

  function hasStamnina(IUintComp components, uint256 id) internal view returns (bool) {
    return StaminaComponent(getAddressById(components, StaminaCompID)).has(id);
  }

  function hasViolence(IUintComp components, uint256 id) internal view returns (bool) {
    return ViolenceComponent(getAddressById(components, ViolenceCompID)).has(id);
  }

  /////////////////
  // GETTERS

  function getHarmony(IUintComp components, uint256 id) internal view returns (Stat memory) {
    if (!hasHarmony(components, id)) return Stat(0, 0, 0, 0);
    return HarmonyComponent(getAddressById(components, HarmonyCompID)).get(id);
  }

  function getHarmonyTotal(IUintComp components, uint256 id) internal view returns (int32) {
    return HarmonyComponent(getAddressById(components, HarmonyCompID)).calcTotal(id);
  }

  function getHealth(IUintComp components, uint256 id) internal view returns (Stat memory) {
    if (!hasHealth(components, id)) return Stat(0, 0, 0, 0);
    return HealthComponent(getAddressById(components, HealthCompID)).get(id);
  }

  function getHealthTotal(IUintComp components, uint256 id) internal view returns (int32) {
    return HealthComponent(getAddressById(components, HealthCompID)).calcTotal(id);
  }

  function getPower(IUintComp components, uint256 id) internal view returns (Stat memory) {
    if (!hasPower(components, id)) return Stat(0, 0, 0, 0);
    return PowerComponent(getAddressById(components, PowerCompID)).get(id);
  }

  function getPowerTotal(IUintComp components, uint256 id) internal view returns (int32) {
    return PowerComponent(getAddressById(components, PowerCompID)).calcTotal(id);
  }

  function getSlots(IUintComp components, uint256 id) internal view returns (Stat memory) {
    if (!hasSlots(components, id)) return Stat(0, 0, 0, 0);
    return SlotsComponent(getAddressById(components, SlotsCompID)).get(id);
  }

  function getSlotsTotal(IUintComp components, uint256 id) internal view returns (int32) {
    return SlotsComponent(getAddressById(components, SlotsCompID)).calcTotal(id);
  }

  function getStamina(IUintComp components, uint256 id) internal view returns (Stat memory) {
    if (!hasStamnina(components, id)) return Stat(0, 0, 0, 0);
    return StaminaComponent(getAddressById(components, StaminaCompID)).get(id);
  }

  function getStaminaTotal(IUintComp components, uint256 id) internal view returns (int32) {
    return StaminaComponent(getAddressById(components, StaminaCompID)).calcTotal(id);
  }

  function getViolence(IUintComp components, uint256 id) internal view returns (Stat memory) {
    if (!hasViolence(components, id)) return Stat(0, 0, 0, 0);
    return ViolenceComponent(getAddressById(components, ViolenceCompID)).get(id);
  }

  function getViolenceTotal(IUintComp components, uint256 id) internal view returns (int32) {
    return ViolenceComponent(getAddressById(components, ViolenceCompID)).calcTotal(id);
  }

  /////////////////
  // SETTERS

  // set the harmony stat struct of an entity
  function setHarmony(IUintComp components, uint256 id, Stat memory value) internal {
    HarmonyComponent(getAddressById(components, HarmonyCompID)).set(id, value);
  }

  // set the health stat struct of an entity
  function setHealth(IUintComp components, uint256 id, Stat memory value) internal {
    HealthComponent(getAddressById(components, HealthCompID)).set(id, value);
  }

  // set the power stat struct of an entity
  function setPower(IUintComp components, uint256 id, Stat memory value) internal {
    PowerComponent(getAddressById(components, PowerCompID)).set(id, value);
  }

  // set the slots stat struct of an entity
  function setSlots(IUintComp components, uint256 id, Stat memory value) internal {
    SlotsComponent(getAddressById(components, SlotsCompID)).set(id, value);
  }

  // set the stamina stat struct of an entity
  function setStamina(IUintComp components, uint256 id, Stat memory value) internal {
    StaminaComponent(getAddressById(components, StaminaCompID)).set(id, value);
  }

  // set the violence stat struct of an entity
  function setViolence(IUintComp components, uint256 id, Stat memory value) internal {
    ViolenceComponent(getAddressById(components, ViolenceCompID)).set(id, value);
  }

  /////////////////
  // UNSETTERS

  function unsetHarmony(IUintComp components, uint256 id) internal {
    if (hasHarmony(components, id)) getComponentById(components, HarmonyCompID).remove(id);
  }

  function unsetHealth(IUintComp components, uint256 id) internal {
    if (hasHealth(components, id)) getComponentById(components, HealthCompID).remove(id);
  }

  function unsetPower(IUintComp components, uint256 id) internal {
    if (hasPower(components, id)) getComponentById(components, PowerCompID).remove(id);
  }

  function unsetSlots(IUintComp components, uint256 id) internal {
    if (hasSlots(components, id)) getComponentById(components, SlotsCompID).remove(id);
  }

  function unsetStamina(IUintComp components, uint256 id) internal {
    if (hasStamnina(components, id)) getComponentById(components, StaminaCompID).remove(id);
  }

  function unsetViolence(IUintComp components, uint256 id) internal {
    if (hasViolence(components, id)) getComponentById(components, ViolenceCompID).remove(id);
  }

  ////////////////////
  // COMPONENT GETTERS

  function getStatComponent(
    IUintComp components,
    string memory type_
  ) public view returns (StatComponent) {
    if (LibString.eq(type_, "HEALTH"))
      return HealthComponent(getAddressById(components, HealthCompID));
    if (LibString.eq(type_, "POWER"))
      return PowerComponent(getAddressById(components, PowerCompID));
    if (LibString.eq(type_, "HARMONY"))
      return HarmonyComponent(getAddressById(components, HarmonyCompID));
    if (LibString.eq(type_, "VIOLENCE"))
      return ViolenceComponent(getAddressById(components, ViolenceCompID));
    if (LibString.eq(type_, "SLOTS"))
      return SlotsComponent(getAddressById(components, SlotsCompID));
    if (LibString.eq(type_, "STAMINA"))
      return StaminaComponent(getAddressById(components, StaminaCompID));
    revert("LibStat: invalid stat type");
  }
}
