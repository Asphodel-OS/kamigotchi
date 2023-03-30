// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { FixedPointMathLib as LibFPMath } from "solady/utils/FixedPointMathLib.sol";
import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById, addressToEntity } from "solecs/utils.sol";
import { Gaussian } from "solstat/Gaussian.sol";

import { IdAccountComponent, ID as IdOpCompID } from "components/IdAccountComponent.sol";
import { IdOwnerComponent, ID as IdOwnerCompID } from "components/IdOwnerComponent.sol";
import { IndexPetComponent, ID as IndexPetComponentID } from "components/IndexPetComponent.sol";
import { IsPetComponent, ID as IsPetCompID } from "components/IsPetComponent.sol";
import { PowerComponent, ID as PowerCompID } from "components/PowerComponent.sol";
import { HealthComponent, ID as HealthCompID } from "components/HealthComponent.sol";
import { HealthCurrentComponent, ID as HealthCurrentCompID } from "components/HealthCurrentComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { TimeLastActionComponent, ID as TimeLastCompID } from "components/TimeLastActionComponent.sol";
import { LibEquipment } from "libraries/LibEquipment.sol";
import { LibProduction, RATE_PRECISION as PRODUCTION_PRECISION } from "libraries/LibProduction.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";
import { LibStat } from "libraries/LibStat.sol";

uint256 constant BASE_HARMONY = 0;
uint256 constant BASE_HEALTH = 150;
uint256 constant BASE_POWER = 150;
uint256 constant BASE_SLOTS = 0;
uint256 constant BASE_VIOLENCE = 0;
uint256 constant BURN_RATIO = 50; // energy burned per 100 KAMI produced
uint256 constant BURN_RATIO_PRECISION = 1e2;
uint256 constant DEMO_POWER_MULTIPLIER = 20;

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
    setLastTs(components, id, block.timestamp);
    revive(components, id);

    // set initial stats at 0 to prevent null values
    LibStat.setHarmony(components, id, BASE_HARMONY);
    LibStat.setHealth(components, id, BASE_HEALTH);
    LibStat.setPower(components, id, BASE_POWER);
    LibStat.setSlots(components, id, BASE_SLOTS);
    LibStat.setViolence(components, id, BASE_VIOLENCE);
    return id;
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
    uint256 health = getCurrHealth(components, id);
    uint256 newHealth = health + amt;
    if (newHealth > totalHealth) newHealth = totalHealth;
    setCurrHealth(components, id, newHealth);
  }

  // Update a pet's health to 0 and its state to DEAD
  function kill(IUintComp components, uint256 id) internal {
    StateComponent(getAddressById(components, StateCompID)).set(id, string("DEAD"));
    setCurrHealth(components, id, 0);
  }

  // Update a pet's state to ALIVE
  function revive(IUintComp components, uint256 id) internal {
    StateComponent(getAddressById(components, StateCompID)).set(id, string("ALIVE"));
  }

  // Update the current health of a pet based on its timestamp and health at last action.
  // NOTE: should be called at the top of a System and folllowed up with a require(!isDead).
  // it's a bit gas-inefficient to be doing it this way but saves us plenty of mental energy
  // in catching all the edge cases.
  function syncHealth(IUintComp components, uint256 id) internal returns (uint256 health) {
    health = getCurrHealth(components, id);
    if (isProducing(components, id)) {
      uint256 drain = calcDrain(components, id);
      health = (health > drain) ? health - drain : 0;
      setCurrHealth(components, id, health);
    }
    setLastTs(components, id, block.timestamp);
  }

  /////////////////
  // CALCULATIONS

  // Calculate the affinity multiplier (1e2 precision)
  // TODO: implement
  function calcAffinityMultiplier(
    IUintComp components,
    uint256 sourceID,
    uint256 targetID
  ) internal pure returns (uint256) {
    // string sourceAff = getAffinity(components, sourceID);
    components;
    sourceID;
    targetID;
    return 100;
  }

  // Calculate the total health drain since the last check (rounded up), based on production
  // NOTE: we can't just use LibProd.calcOutput() here because that rounds down, while here
  // we want to properly round. We need a game design discussion on how we want to do this.
  function calcDrain(IUintComp components, uint256 id) internal view returns (uint256) {
    if (!isProducing(components, id)) return 0;
    uint256 productionID = getProduction(components, id);
    uint256 prodRate = LibProduction.getRate(components, productionID); // KAMI/s (1e18 precision)
    uint256 duration = block.timestamp - getLastTs(components, id);
    uint256 totalPrecision = BURN_RATIO_PRECISION * PRODUCTION_PRECISION; // BURN_RATIO(1e2) * prodRate(1e18)
    return (duration * prodRate * BURN_RATIO + (totalPrecision / 2)) / totalPrecision;
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

  // Check whether an account is the pet's account.
  function isAccount(
    IUintComp components,
    uint256 id,
    uint256 accountID
  ) internal view returns (bool) {
    return getAccount(components, id) == accountID;
  }

  // Check whether a pet is dead.
  // NOTE: this assumes the pet's health has been synced in this block.
  function isDead(IUintComp components, uint256 id) internal view returns (bool) {
    return getCurrHealth(components, id) == 0;
  }

  // Check whether a pet has an ongoing production.
  function isProducing(IUintComp components, uint256 id) internal view returns (bool result) {
    uint256 productionID = LibProduction.getForPet(components, id);
    if (productionID != 0 && LibProduction.isActive(components, productionID)) result = true;
  }

  /////////////////
  // SETTERS

  // set a pet's stats from its traits
  // TODO: actually set stats from traits. hardcoded currently
  function setStats(IUintComp components, uint256 id) internal {
    uint256 power = BASE_POWER * DEMO_POWER_MULTIPLIER;
    PowerComponent(getAddressById(components, PowerCompID)).set(id, power);

    uint256 totalHealth = _smolRandom(BASE_HEALTH, id);
    HealthComponent(getAddressById(components, HealthCompID)).set(id, totalHealth);
    HealthCurrentComponent(getAddressById(components, HealthCurrentCompID)).set(id, totalHealth);
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
    IdAccountComponent(getAddressById(components, IdOpCompID)).set(id, accountID);
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

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddressById(components, NameCompID)).getValue(id);
  }

  function getMediaURI(IUintComp components, uint256 id) internal view returns (string memory) {
    return MediaURIComponent(getAddressById(components, MediaURICompID)).getValue(id);
  }

  // get the entity ID of the pet account
  function getAccount(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdAccountComponent(getAddressById(components, IdOpCompID)).getValue(id);
  }

  // get the entity ID of the pet owner
  function getOwner(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdOwnerComponent(getAddressById(components, IdOwnerCompID)).getValue(id);
  }

  // Get the production of a pet. Return 0 if there are none.
  function getProduction(IUintComp components, uint256 id) internal view returns (uint256) {
    return LibProduction.getForPet(components, id);
  }

  /////////////////
  // QUERIES

  // get the entity ID of a pet from its index (tokenID)
  function indexToID(IUintComp components, uint256 index) internal view returns (uint256 result) {
    uint256[] memory results = IndexPetComponent(getAddressById(components, IndexPetComponentID))
      .getEntitiesWithValue(index);
    if (results.length > 0) {
      result = results[0];
    }
  }

  // get the index of a pet (aka its 721 tokenID) from its entity ID
  function idToIndex(IUintComp components, uint256 entityID) internal view returns (uint256) {
    return IndexPetComponent(getAddressById(components, IndexPetComponentID)).getValue(entityID);
  }

  /////////////////
  // ERC721

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
  // MISC

  // temporary function to stimulate a little randomness
  function _smolRandom(uint256 base, uint256 seed) internal pure returns (uint256) {
    return (base / 2) + (uint256(keccak256(abi.encode(seed, base))) % base);
  }
}
