// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { HealthComponent, ID as HealthCompID } from "components/HealthComponent.sol";
import { HarmonyComponent, ID as HarmonyCompID } from "components/HarmonyComponent.sol";
import { PowerComponent, ID as PowerCompID } from "components/PowerComponent.sol";
import { SlotsComponent, ID as SlotsCompID } from "components/SlotsComponent.sol";
import { ViolenceComponent, ID as ViolenceCompID } from "components/ViolenceComponent.sol";

// Stat is a struct that holds the modifying values of a core stat.
// Total = mult * (base + shift)
struct Stat {
  int32 base;
  int32 shift;
  int32 mult; // 3 decimals of precision
  int32 last;
}

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
      uint256 val = IUintComp(getAddressById(components, componentIDs[i])).getValue(fromID);
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

    uint256 i;
    uint256[] memory statComponents = new uint256[](statCount);
    if (hasPower(components, id)) statComponents[i++] = PowerCompID;
    if (hasHealth(components, id)) statComponents[i++] = HealthCompID;
    if (hasHarmony(components, id)) statComponents[i++] = HarmonyCompID;
    if (hasViolence(components, id)) statComponents[i++] = ViolenceCompID;
    if (hasSlots(components, id)) statComponents[i++] = SlotsCompID;
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

  function hasViolence(IUintComp components, uint256 id) internal view returns (bool) {
    return ViolenceComponent(getAddressById(components, ViolenceCompID)).has(id);
  }

  /////////////////
  // SETTERS

  function setHarmony(IUintComp components, uint256 id, uint256 value) internal {
    HarmonyComponent(getAddressById(components, HarmonyCompID)).set(id, value);
  }

  function setHealth(IUintComp components, uint256 id, uint256 value) internal {
    HealthComponent(getAddressById(components, HealthCompID)).set(id, value);
  }

  function setPower(IUintComp components, uint256 id, uint256 value) internal {
    PowerComponent(getAddressById(components, PowerCompID)).set(id, value);
  }

  function setSlots(IUintComp components, uint256 id, uint256 value) internal {
    SlotsComponent(getAddressById(components, SlotsCompID)).set(id, value);
  }

  function setViolence(IUintComp components, uint256 id, uint256 value) internal {
    ViolenceComponent(getAddressById(components, ViolenceCompID)).set(id, value);
  }

  /////////////////
  // GETTERS

  function getHarmony(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!hasHarmony(components, id)) return 0;
    return HarmonyComponent(getAddressById(components, HarmonyCompID)).getValue(id);
  }

  function getHealth(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!hasHealth(components, id)) return 0;
    return HealthComponent(getAddressById(components, HealthCompID)).getValue(id);
  }

  function getPower(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!hasPower(components, id)) return 0;
    return PowerComponent(getAddressById(components, PowerCompID)).getValue(id);
  }

  function getSlots(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!hasSlots(components, id)) return 0;
    return SlotsComponent(getAddressById(components, SlotsCompID)).getValue(id);
  }

  function getViolence(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!hasViolence(components, id)) return 0;
    return ViolenceComponent(getAddressById(components, ViolenceCompID)).getValue(id);
  }

  /////////////////
  // REMOVERS

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

  function unsetViolence(IUintComp components, uint256 id) internal {
    if (hasViolence(components, id)) getComponentById(components, ViolenceCompID).remove(id);
  }
}
