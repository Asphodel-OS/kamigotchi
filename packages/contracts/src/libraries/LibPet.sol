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

import { CanNameComponent, ID as CanNameCompID } from "components/CanNameComponent.sol";
import { IdAccountComponent, ID as IdAccCompID } from "components/IdAccountComponent.sol";
import { IndexPetComponent, ID as IndexPetComponentID } from "components/IndexPetComponent.sol";
import { IsPetComponent, ID as IsPetCompID } from "components/IsPetComponent.sol";
import { ExperienceComponent, ID as ExperienceCompID } from "components/ExperienceComponent.sol";
import { HealthCurrentComponent, ID as HealthCurrentCompID } from "components/HealthCurrentComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { TimeLastActionComponent, ID as TimeLastCompID } from "components/TimeLastActionComponent.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibEquipment } from "libraries/LibEquipment.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibProduction } from "libraries/LibProduction.sol";
import { LibRegistryAffinity } from "libraries/LibRegistryAffinity.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";
import { LibStat } from "libraries/LibStat.sol";
import { LibTrait } from "libraries/LibTrait.sol";

uint256 constant BURN_RATIO = 50; // energy burned per 100 KAMI produced
uint256 constant BURN_RATIO_PRECISION = 1e2;
uint256 constant RECOVERY_RATE_PRECISION = 1e18;
uint256 constant RECOVERY_RATE_FLAT_MULTIPLIER = 1;

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
    uint256 accountID,
    uint256 index,
    string memory uri
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsPetComponent(getAddressById(components, IsPetCompID)).set(id);
    IndexPetComponent(getAddressById(components, IndexPetComponentID)).set(id, index);
    setAccount(components, id, accountID);
    setMediaURI(components, id, uri);
    setState(components, id, "UNREVEALED");
    setExperience(components, id, 0);

    string memory name = LibString.concat("kamigotchi ", LibString.toString(index));
    setName(components, id, name);
    return id;
  }

  // bridging a pet Outside => MUD. Does not handle account details
  function stake(IUintComp components, uint256 id, uint256 accountID) internal {
    setState(components, id, "RESTING");
    setAccount(components, id, accountID);
  }

  // bridging a pet MUD => Outside. Does not handle account details
  function unstake(IUintComp components, uint256 id) internal {
    setState(components, id, "721_EXTERNAL");
    setAccount(components, id, 0);
  }

  function addExperience(IUintComp components, uint256 id, uint256 amt) internal {
    uint256 exp = getExperience(components, id);
    setExperience(components, id, exp + amt);
  }

  // Drains HP from a pet. The opposite of heal().
  function drain(IUintComp components, uint256 id, uint256 amt) internal {
    uint256 health = getLastHealth(components, id);
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
  function heal(IUintComp components, uint256 id, uint256 amt) internal {
    uint256 totalHealth = calcTotalHealth(components, id);
    uint256 health = getLastHealth(components, id) + amt;
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
  //       this function is for components saved directly on the Pet Entity
  function reveal(IUintComp components, uint256 id) internal {
    setCanName(components, id, true);
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
  function syncHealth(IUintComp components, uint256 id) public {
    if (isHarvesting(components, id)) {
      // drain health if harvesting
      uint256 drainAmt = calcProductionDrain(components, id);
      drain(components, id, drainAmt);
    } else if (isResting(components, id)) {
      // recover health if resting
      uint256 healAmt = calcRestingRecovery(components, id);
      heal(components, id, healAmt);
    }
    setLastTs(components, id, block.timestamp);
  }

  // transfer ERC721 pet
  // NOTE: it doesnt seem we actually need IdOwner directly on the pet as it can be
  // directly accessed through the account entity.
  // NOTE 2: transfers are disabled in game
  function transfer(IUintComp components, uint256 index, uint256 accountID) internal {
    // does not need to check for previous owner, ERC721 handles it
    uint256 id = indexToID(components, index);
    setAccount(components, id, accountID);
  }

  /////////////////
  // CALCULATIONS

  // Calculate the affinity multiplier (1e2 precision) for attacks between two kamis
  // TODO: implement
  function calcAttackAffinityMultiplier(
    IUintComp components,
    uint256 sourceID,
    uint256 targetID
  ) internal view returns (uint256) {
    string memory targetAff = getAffinities(components, targetID)[0];
    string memory sourceAff = getAffinities(components, sourceID)[1];
    return LibRegistryAffinity.getAttackMultiplier(sourceAff, targetAff);
  }

  // Calculate the total health drain from harvesting (rounded up) since the last check. This is
  // based on the Kami's production and assumes that information is up to date.
  // NOTE: we can't just use LibProd.calcOutput() here because that rounds down, while here
  // we want to properly round. We need a game design discussion on how we want to do this.
  function calcProductionDrain(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 productionID = getProduction(components, id);
    uint256 duration = block.timestamp - getLastTs(components, id);
    uint256 harvestRate = LibProduction.getRate(components, productionID);
    uint256 harvestRatePrecision = 10 ** LibConfig.getValueOf(components, "HARVEST_RATE_PREC");
    uint256 base = LibConfig.getValueOf(components, "HEALTH_RATE_DRAIN_BASE");
    uint256 basePrecision = 10 ** LibConfig.getValueOf(components, "HEALTH_RATE_DRAIN_BASE_PREC");
    uint256 totalPrecision = basePrecision * harvestRatePrecision;
    return (duration * harvestRate * base + (totalPrecision / 2)) / totalPrecision;
  }

  // Calculate the recovery of the kami from resting. This assumes the Kami is actually resting.
  function calcRestingRecovery(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 duration = block.timestamp - getLastTs(components, id);
    uint256 rate = calcRestingRecoveryRate(components, id);
    uint256 precision = 10 ** LibConfig.getValueOf(components, "HEALTH_RATE_HEAL_PREC");
    return (duration * rate) / precision;
  }

  // calculates the health recovery rate of the Kami per second. Assumed resting.
  function calcRestingRecoveryRate(
    IUintComp components,
    uint256 id
  ) internal view returns (uint256) {
    uint256 totalHarmony = calcTotalHarmony(components, id);
    uint256 precision = 10 ** LibConfig.getValueOf(components, "HEALTH_RATE_HEAL_PREC");
    uint256 base = LibConfig.getValueOf(components, "HEALTH_RATE_HEAL_BASE");
    uint256 basePrecision = 10 ** LibConfig.getValueOf(components, "HEALTH_RATE_HEAL_BASE_PREC");
    return (totalHarmony * base * precision) / (3600 * basePrecision);
  }

  // Calculate the liquidation threshold for target pet, attacked by the source pet.
  // This is measured as a proportion of total health with 1e18 precision. (i.e. 1e18 = 100%)
  function calcThreshold(
    IUintComp components,
    uint256 sourceID,
    uint256 targetID
  ) internal view returns (uint256) {
    uint256 baseThreshold = calcThresholdBase(components, sourceID, targetID);
    uint256 affinityMultiplier = calcAttackAffinityMultiplier(components, sourceID, targetID);
    return (affinityMultiplier * baseThreshold) / 100; // adjust for affinity multiplier precision
  }

  // Calculate the base liquidation threshold for target pet, attacked by the source pet.
  // LT = .2 * Φ(ln(V_s / H_t)) (as proportion of total health with 1e18 precision).
  function calcThresholdBase(
    IUintComp components,
    uint256 sourceID,
    uint256 targetID
  ) internal view returns (uint256) {
    uint256 sourceViolence = calcTotalViolence(components, sourceID);
    uint256 targetHarmony = calcTotalHarmony(components, targetID);
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

  // Check wether a pet can be named
  function canName(IUintComp components, uint256 id) internal view returns (bool) {
    return CanNameComponent(getAddressById(components, CanNameCompID)).has(id);
  }

  // Check whether a pet is dead.
  function isDead(IUintComp components, uint256 id) internal view returns (bool) {
    return LibString.eq(getState(components, id), "DEAD");
  }

  // Check whether the kami is fully healed.
  function isFull(IUintComp components, uint256 id) internal view returns (bool) {
    return calcTotalHealth(components, id) == getLastHealth(components, id);
  }

  // Check whether a pet is harvesting.
  function isHarvesting(IUintComp components, uint256 id) internal view returns (bool result) {
    return LibString.eq(getState(components, id), "HARVESTING");
  }

  // Check whether the current health of a pet is greater than 0. Assume health synced this block.
  function isHealthy(IUintComp components, uint256 id) internal view returns (bool) {
    return getLastHealth(components, id) > 0;
  }

  // Check whether a pet's ERC721 token is in the game world
  function isInWorld(IUintComp components, uint256 id) internal view returns (bool) {
    return !LibString.eq(getState(components, id), "721_EXTERNAL");
  }

  // checks whether an entity is a pet
  function isPet(IUintComp components, uint256 id) internal view returns (bool) {
    return IsPetComponent(getAddressById(components, IsPetCompID)).has(id);
  }

  // Check whether a pet is resting.
  function isResting(IUintComp components, uint256 id) internal view returns (bool) {
    return LibString.eq(getState(components, id), "RESTING");
  }

  // Check whether a pet is revealed
  function isUnrevealed(IUintComp components, uint256 id) internal view returns (bool) {
    return LibString.eq(getState(components, id), "UNREVEALED");
  }

  /////////////////
  // SETTERS

  // set a pet's stats from its traits
  function setStats(IUintComp components, uint256 id) internal {
    uint256 health = LibConfig.getValueOf(components, "KAMI_BASE_HEALTH");
    uint256 power = LibConfig.getValueOf(components, "KAMI_BASE_POWER");
    uint256 violence = LibConfig.getValueOf(components, "KAMI_BASE_VIOLENCE");
    uint256 harmony = LibConfig.getValueOf(components, "KAMI_BASE_HARMONY");
    uint256 slots = LibConfig.getValueOf(components, "KAMI_BASE_SLOTS");

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
    setCurrHealth(components, id, health);
    LibStat.setHealth(components, id, health);
    LibStat.setPower(components, id, power);
    LibStat.setViolence(components, id, violence);
    LibStat.setHarmony(components, id, harmony);
    LibStat.setSlots(components, id, slots);
  }

  // add or remove the CanName component
  function setCanName(IUintComp components, uint256 id, bool can) internal {
    if (can) {
      CanNameComponent(getAddressById(components, CanNameCompID)).set(id);
    } else if (CanNameComponent(getAddressById(components, CanNameCompID)).has(id)) {
      CanNameComponent(getAddressById(components, CanNameCompID)).remove(id);
    }
  }

  function setCurrHealth(IUintComp components, uint256 id, uint256 currHealth) internal {
    HealthCurrentComponent(getAddressById(components, HealthCurrentCompID)).set(id, currHealth);
  }

  function setExperience(IUintComp components, uint256 id, uint256 experience) internal {
    ExperienceComponent(getAddressById(components, ExperienceCompID)).set(id, experience);
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

  function setState(IUintComp components, uint256 id, string memory state) internal {
    StateComponent(getAddressById(components, StateCompID)).set(id, state);
  }

  /////////////////
  // GETTERS

  // get the entity ID of the pet account
  function getAccount(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdAccountComponent(getAddressById(components, IdAccCompID)).getValue(id);
  }

  function getExperience(IUintComp components, uint256 id) internal view returns (uint256) {
    return ExperienceComponent(getAddressById(components, ExperienceCompID)).getValue(id);
  }

  // gets the last explicitly set health of a pet. naming discrepancy for clarity
  function getLastHealth(IUintComp components, uint256 id) internal view returns (uint256) {
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

  function getMediaURI(IUintComp components, uint256 id) internal view returns (string memory) {
    return MediaURIComponent(getAddressById(components, MediaURICompID)).getValue(id);
  }

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddressById(components, NameCompID)).getValue(id);
  }

  // get the entity ID of the pet owner
  function getOwner(IUintComp components, uint256 id) internal view returns (address) {
    uint256 accountID = getAccount(components, id);
    return LibAccount.getOwner(components, accountID);
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

  // get the pet's affinities. hardcoded to check for face, body, and arms.
  // in the future, can upgrade here
  function getAffinities(IUintComp components, uint256 id) internal view returns (string[] memory) {
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

  // retrieves the pet with the specified name
  function getByName(
    IUintComp components,
    string memory name
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsPetCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, NameCompID),
      abi.encode(name)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length > 0) result = results[0];
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
