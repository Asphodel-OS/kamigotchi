// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { FixedPointMathLib as LibFPMath } from "solady/utils/FixedPointMathLib.sol";
import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById, addressToEntity } from "solecs/utils.sol";
import { Gaussian } from "solstat/Gaussian.sol";

import { IdAccountComponent, ID as IdAccCompID } from "components/IdAccountComponent.sol";
import { IdOwnerComponent, ID as IdOwnerCompID } from "components/IdOwnerComponent.sol";
import { IndexPetComponent, ID as IndexPetComponentID } from "components/IndexPetComponent.sol";
import { IsPetComponent, ID as IsPetCompID } from "components/IsPetComponent.sol";
import { HarmonyComponent, ID as HarmonyCompID } from "components/HarmonyComponent.sol";
import { HealthComponent, ID as HealthCompID } from "components/HealthComponent.sol";
import { HealthCurrentComponent, ID as HealthCurrentCompID } from "components/HealthCurrentComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { PowerComponent, ID as PowerCompID } from "components/PowerComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { ViolenceComponent, ID as ViolenceCompID } from "components/ViolenceComponent.sol";
import { TimeLastActionComponent, ID as TimeLastCompID } from "components/TimeLastActionComponent.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibEquipment } from "libraries/LibEquipment.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibProduction, RATE_PRECISION as PRODUCTION_PRECISION } from "libraries/LibProduction.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";
import { LibRegistryTrait } from "libraries/LibRegistryTrait.sol";
import { LibStat } from "libraries/LibStat.sol";
import { LibTrait } from "libraries/LibTrait.sol";

uint256 constant BASE_HARMONY = 20;
uint256 constant BASE_HEALTH = 50;
uint256 constant BASE_POWER = 20;
uint256 constant BASE_VIOLENCE = 20;
uint256 constant BASE_SLOTS = 2;
uint256 constant BURN_RATIO = 50; // energy burned per 100 KAMI produced
uint256 constant BURN_RATIO_PRECISION = 1e2;
uint256 constant RECOVERY_RATE_PRECISION = 1e18;
uint256 constant DEMO_RECOVERY_RATE_MULTIPLIER = 100;
uint256 constant DEMO_POWER_MULTIPLIER = 250;
uint256 constant DEMO_VIOLENCE_MULTIPLIER = 3;

library LibPet {
  using LibFPMath for int256;

  /////////////////
  // INTERACTIONS

  // create a pet entity, set its owner and account for an entity
  // NOTE: we may need to create an Account/Owner entities here if they dont exist
  // TODO: include attributes in this generation
  function create(
    IWorld world,
    IUintComp components,
    address owner,
    uint256 accountID,
    uint256 index,
    string memory uri
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsPetComponent(getAddressById(components, IsPetCompID)).set(id);
    IndexPetComponent(getAddressById(components, IndexPetComponentID)).set(id, index);

    string memory name = LibString.concat("kamigotchi ", LibString.toString(index));
    setName(components, id, name);
    setOwner(components, id, addressToEntity(owner));
    setAccount(components, id, accountID);
    setMediaURI(components, id, uri);
    setState(components, id, "UNREVEALED");
    return id;
  }

  // Drains HP from a pet. The opposite of heal().
  function drain(IUintComp components, uint256 id, uint256 amt) internal {
    uint256 health = getCurrHealth(components, id);
    health = (health > amt) ? health - amt : 0;
    setCurrHealth(components, id, health);
  }

  // feed the pet with a food item
  // NOTE: assumes the pet health is synced prior to this call
  function feed(
    IUintComp components,
    uint256 id,
    uint256 foodIndex
  ) internal returns (bool success) {
    uint256 foodRegistryID = LibRegistryItem.getByFoodIndex(components, foodIndex);
    if (foodRegistryID != 0) {
      success = true;
      uint256 healAmt = LibStat.getHealth(components, foodRegistryID);
      heal(components, id, healAmt);
    }
  }

  // heal the pet by a given amount
  // NOTE: assumes the pet health is synced prior to this call
  function heal(IUintComp components, uint256 id, uint256 amt) internal {
    uint256 totalHealth = calcTotalHealth(components, id);
    uint256 health = getCurrHealth(components, id) + amt;
    if (health > totalHealth) health = totalHealth;
    setCurrHealth(components, id, health);
  }

  // Update a pet's health to 0 and its state to DEAD
  function kill(IUintComp components, uint256 id) internal {
    StateComponent(getAddressById(components, StateCompID)).set(id, string("DEAD"));
    setCurrHealth(components, id, 0);
  }

  // called when a pet is revealed
  // NOTE: most of the reveal logic (generation) is in the ERC721MetadataSystem itself
  //       this function is for components saved directely on the Pet Entity
  function reveal(IUintComp components, uint256 id) internal {
    revive(components, id);
    setStats(components, id);
    setLastTs(components, id, block.timestamp);
  }

  // Update a pet's state to RESTING
  function revive(IUintComp components, uint256 id) internal {
    StateComponent(getAddressById(components, StateCompID)).set(id, string("RESTING"));
  }

  // Update the current health of a pet based on its timestamp and health at last action.
  // NOTE: should be called at the top of a System and folllowed up with a require(!isDead).
  // it's a bit gas-inefficient to be doing it this way but saves us plenty of mental energy
  // in catching all the edge cases.
  function syncHealth(IUintComp components, uint256 id) internal {
    if (isHarvesting(components, id)) {
      // drain health if harvesting
      uint256 drainAmt = calcDrain(components, id);
      drain(components, id, drainAmt);
    } else if (isResting(components, id)) {
      // recover health if resting
      uint256 healAmt = calcRecovery(components, id);
      heal(components, id, healAmt);
    }
    setLastTs(components, id, block.timestamp);
  }

  // transfer ERC721 pet
  // NOTE: it doesnt seem we actually need IdOwner directly on the pet as it can be
  // directly accessed through the account entity.
  function transfer(IUintComp components, uint256 index, uint256 accountID) internal {
    // does not need to check for previous owner, ERC721 handles it
    uint256 id = indexToID(components, index);
    uint256 ownerID = getOwner(components, accountID);

    setOwner(components, id, ownerID);
    setAccount(components, id, accountID);
  }

  /////////////////
  // CALCULATIONS

  // Calculate the affinity multiplier (1e2 precision)
  // TODO: implement
  function calcAffinityMultiplier(
    IUintComp components,
    uint256 sourceID,
    uint256 targetID
  ) internal view returns (uint256) {
    string memory targetAff = getAffinity(components, targetID)[0];
    string memory sourceAff = getAffinity(components, sourceID)[1];
    if (
      LibString.eq(targetAff, sourceAff) ||
      LibString.eq(targetAff, "Normal") ||
      LibString.eq(targetAff, "Normal")
    ) {
      return 100;
    } else if (LibString.eq(sourceAff, "Eerie")) {
      if (LibString.eq(targetAff, "Scrap")) return 200;
      if (LibString.eq(targetAff, "Insect")) return 50;
    } else if (LibString.eq(sourceAff, "Scrap")) {
      if (LibString.eq(targetAff, "Insect")) return 200;
      if (LibString.eq(targetAff, "Eerie")) return 50;
    } else if (LibString.eq(sourceAff, "Insect")) {
      if (LibString.eq(targetAff, "Eerie")) return 200;
      if (LibString.eq(targetAff, "Scrap")) return 50;
    }

    return 100;
  }

  // Calculate the total health drain from harvesting (rounded up) since the last check. This is
  // based on the Kami's production and assumes that information is up to date.
  // NOTE: we can't just use LibProd.calcOutput() here because that rounds down, while here
  // we want to properly round. We need a game design discussion on how we want to do this.
  function calcDrain(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 productionID = getProduction(components, id);
    uint256 prodRate = LibProduction.getRate(components, productionID); // KAMI/s (1e18 precision)
    uint256 duration = block.timestamp - getLastTs(components, id);
    uint256 totalPrecision = BURN_RATIO_PRECISION * PRODUCTION_PRECISION; // BURN_RATIO(1e2) * prodRate(1e18)
    return (duration * prodRate * BURN_RATIO + (totalPrecision / 2)) / totalPrecision;
  }

  // Calculate the recovery of the kami from resting. This assumes the Kami is actually resting.
  function calcRecovery(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 duration = block.timestamp - getLastTs(components, id);
    uint256 recoveryRate = calcRecoveryRate(components, id); // 1e18 precision
    return (duration * recoveryRate) / RECOVERY_RATE_PRECISION;
  }

  // calculates the health recovery rate of the Kami per second (1e18 precision). Assumed resting.
  function calcRecoveryRate(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 totalHarmony = calcTotalHarmony(components, id);
    return (totalHarmony * DEMO_RECOVERY_RATE_MULTIPLIER * RECOVERY_RATE_PRECISION) / 3600;
  }

  // Calculate the liquidation threshold for target pet, attacked by the source pet.
  // This is measured as a proportion of total health with 1e18 precision.
  function calcThreshold(
    IUintComp components,
    uint256 sourceID,
    uint256 targetID
  ) internal view returns (uint256) {
    uint256 baseThreshold = calcThresholdBase(components, sourceID, targetID);
    uint256 affinityMultiplier = calcAffinityMultiplier(components, sourceID, targetID);
    return (affinityMultiplier * baseThreshold) / 1e2;
  }

  // Calculate the base liquidation threshold for target pet, attacked by the source pet.
  // LT = .2 * Φ(ln(V_s / H_t)) (as proportion of total health with 1e18 precision).
  function calcThresholdBase(
    IUintComp components,
    uint256 sourceID,
    uint256 targetID
  ) internal view returns (uint256) {
    uint256 sourceViolence = calcTotalViolence(components, sourceID);
    uint256 targetHarmony = calcTotalHarmony(components, targetID) + 1;
    int256 ratio = int256((1e18 * sourceViolence) / targetHarmony);
    int256 weight = Gaussian.cdf(LibFPMath.lnWad(ratio));
    return (uint256(weight) * 20) / 100;
  }

  // Calculate and return the total health of a pet (including mods and equips)
  function calcTotalHarmony(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 totalHarmony = LibStat.getHarmony(components, id);
    uint256[] memory equipment = LibEquipment.getForPet(components, id);
    for (uint256 i = 0; i < equipment.length; i++) {
      totalHarmony += LibEquipment.getHarmony(components, equipment[i]);
    }
    return totalHarmony;
  }

  // Calculate and return the total health of a pet (including mods and equips)
  function calcTotalHealth(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 totalHealth = LibStat.getHealth(components, id);
    uint256[] memory equipment = LibEquipment.getForPet(components, id);
    for (uint256 i = 0; i < equipment.length; i++) {
      totalHealth += LibEquipment.getHealth(components, equipment[i]);
    }
    return totalHealth;
  }

  // Calculate and return the total power of a pet (including mods and equips)
  function calcTotalPower(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 totalPower = LibStat.getPower(components, id);
    uint256[] memory equipment = LibEquipment.getForPet(components, id);
    for (uint256 i = 0; i < equipment.length; i++) {
      totalPower += LibEquipment.getPower(components, equipment[i]);
    }
    return totalPower;
  }

  // Calculate and return the total violence of a pet (including mods and equips)
  function calcTotalViolence(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 totalViolence = LibStat.getViolence(components, id);
    uint256[] memory equipment = LibEquipment.getForPet(components, id);
    for (uint256 i = 0; i < equipment.length; i++) {
      totalViolence += LibEquipment.getViolence(components, equipment[i]);
    }
    return totalViolence;
  }

  /////////////////
  // CHECKERS

  // Check whether a pet is dead.
  function isDead(IUintComp components, uint256 id) internal view returns (bool) {
    return LibString.eq(getState(components, id), "DEAD");
  }

  // Check whether the kami is fully healed.
  function isFull(IUintComp components, uint256 id) internal view returns (bool) {
    return calcTotalHealth(components, id) == getCurrHealth(components, id);
  }

  // Check whether a pet is harvesting.
  function isHarvesting(IUintComp components, uint256 id) internal view returns (bool result) {
    return LibString.eq(getState(components, id), "HARVESTING");
    // uint256 productionID = LibProduction.getForPet(components, id);
    // if (productionID != 0 && LibProduction.isActive(components, productionID)) result = true;
  }

  // Check whether a pet is resting.
  function isResting(IUintComp components, uint256 id) internal view returns (bool) {
    return LibString.eq(getState(components, id), "RESTING");
  }

  // Check whether the current health of a pet is greater than 0. Assume health synced this block.
  function isHealthy(IUintComp components, uint256 id) internal view returns (bool) {
    return getCurrHealth(components, id) > 0;
  }

  // Check whether a pet's ERC721 token is in the game world
  function isInWorld(IUintComp components, uint256 id) internal view returns (bool) {
    return !LibString.eq(getState(components, id), "721_EXTERNAL");
  }

  /////////////////
  // SETTERS

  // set a pet's stats from its traits
  function setStats(IUintComp components, uint256 id) internal {
    uint256 health = BASE_HEALTH;
    uint256 power = BASE_POWER;
    uint256 violence = BASE_VIOLENCE;
    uint256 harmony = BASE_HARMONY;
    uint256 slots = BASE_SLOTS;

    // sum the stats from all traits
    uint256 traitRegistryID;
    uint256[] memory traits = getTraits(components, id);
    for (uint256 i = 0; i < traits.length; i++) {
      traitRegistryID = traits[i];
      health += LibStat.getHealth(components, traitRegistryID);
      power += LibStat.getPower(components, traitRegistryID);
      violence += LibStat.getViolence(components, traitRegistryID);
      harmony += LibStat.getHarmony(components, traitRegistryID);
      slots += LibStat.getSlots(components, traitRegistryID);
    }

    // set the stats
    LibStat.setHealth(components, id, BASE_HEALTH + health);
    setCurrHealth(components, id, BASE_HEALTH + health);
    LibStat.setPower(components, id, DEMO_POWER_MULTIPLIER * power);
    LibStat.setViolence(components, id, DEMO_VIOLENCE_MULTIPLIER * violence);
    LibStat.setHarmony(components, id, harmony);
    LibStat.setSlots(components, id, slots);
  }

  function setCurrHealth(IUintComp components, uint256 id, uint256 currHealth) internal {
    HealthCurrentComponent(getAddressById(components, HealthCurrentCompID)).set(id, currHealth);
  }

  // Update the TimeLastAction of a pet. used to expected battery drain on next action
  function setLastTs(IUintComp components, uint256 id, uint256 ts) internal {
    TimeLastActionComponent(getAddressById(components, TimeLastCompID)).set(id, ts);
  }

  function setMediaURI(IUintComp components, uint256 id, string memory uri) internal {
    MediaURIComponent(getAddressById(components, MediaURICompID)).set(id, uri);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
  }

  function setAccount(IUintComp components, uint256 id, uint256 accountID) internal {
    IdAccountComponent(getAddressById(components, IdAccCompID)).set(id, accountID);
  }

  function setOwner(IUintComp components, uint256 id, uint256 ownerID) internal {
    IdOwnerComponent(getAddressById(components, IdOwnerCompID)).set(id, ownerID);
  }

  function setState(IUintComp components, uint256 id, string memory state) internal {
    StateComponent(getAddressById(components, StateCompID)).set(id, state);
  }

  /////////////////
  // GETTERS

  function getCurrHealth(IUintComp components, uint256 id) internal view returns (uint256) {
    return HealthCurrentComponent(getAddressById(components, HealthCurrentCompID)).getValue(id);
  }

  function getLastTs(IUintComp components, uint256 id) internal view returns (uint256) {
    return TimeLastActionComponent(getAddressById(components, TimeLastCompID)).getValue(id);
  }

  // Get the implied location of a pet based on its state.
  function getLocation(IUintComp components, uint256 id) internal view returns (uint256 location) {
    string memory state = getState(components, id);

    if (LibString.eq(state, "HARVESTING")) {
      uint256 productionID = getProduction(components, id);
      uint256 nodeID = LibProduction.getNode(components, productionID);
      location = LibNode.getLocation(components, nodeID);
    } else if (LibString.eq(state, "RESTING")) {
      uint256 accountID = getAccount(components, id);
      location = LibAccount.getLocation(components, accountID);
    }
  }

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddressById(components, NameCompID)).getValue(id);
  }

  function getMediaURI(IUintComp components, uint256 id) internal view returns (string memory) {
    return MediaURIComponent(getAddressById(components, MediaURICompID)).getValue(id);
  }

  // get the entity ID of the pet account
  function getAccount(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdAccountComponent(getAddressById(components, IdAccCompID)).getValue(id);
  }

  // get the entity ID of the pet owner
  function getOwner(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdOwnerComponent(getAddressById(components, IdOwnerCompID)).getValue(id);
  }

  // Get the production of a pet. Return 0 if there are none.
  function getProduction(IUintComp components, uint256 id) internal view returns (uint256) {
    return LibProduction.getForPet(components, id);
  }

  function getState(IUintComp components, uint256 id) internal view returns (string memory) {
    return StateComponent(getAddressById(components, StateCompID)).getValue(id);
  }

  // Get the traits of a pet, specifically the list of trait registry IDs
  function getTraits(IUintComp components, uint256 id) internal view returns (uint256[] memory) {
    uint256[] memory traits = new uint256[](5);
    traits[0] = LibTrait.getBackgroundPointer(components, id);
    traits[1] = LibTrait.getBodyPointer(components, id);
    traits[2] = LibTrait.getColorPointer(components, id);
    traits[3] = LibTrait.getFacePointer(components, id);
    traits[4] = LibTrait.getHandPointer(components, id);
    return traits;
  }

  // get pet's affinity. hardcoded to check for face, body, and arms.
  // in the future, can upgrade here
  function getAffinity(IUintComp components, uint256 id) internal view returns (string[] memory) {
    string[] memory affinities = new string[](3);
    affinities[0] = LibStat.getAffinity(components, LibTrait.getBodyPointer(components, id));
    affinities[1] = LibStat.getAffinity(components, LibTrait.getHandPointer(components, id));
    affinities[2] = LibStat.getAffinity(components, LibTrait.getFacePointer(components, id));

    return affinities;
  }

  /////////////////
  // QUERIES

  // get the entity ID of a pet from its index (tokenID)
  function indexToID(IUintComp components, uint256 index) internal view returns (uint256 result) {
    uint256[] memory results = IndexPetComponent(getAddressById(components, IndexPetComponentID))
      .getEntitiesWithValue(index);
    // assumes only 1 pet per index
    if (results.length > 0) {
      result = results[0];
    }
  }

  // get the index of a pet (aka its 721 tokenID) from its entity ID
  function idToIndex(IUintComp components, uint256 entityID) internal view returns (uint256) {
    return IndexPetComponent(getAddressById(components, IndexPetComponentID)).getValue(entityID);
  }

  // gets all the pets owned by an account
  function getAllForAccount(
    IUintComp components,
    uint256 accountID
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsPetCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdAccCompID),
      abi.encode(accountID)
    );

    return LibQuery.query(fragments);
  }
}
