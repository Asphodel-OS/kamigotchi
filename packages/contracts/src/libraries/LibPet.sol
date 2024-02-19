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

import { Stat } from "components/types/StatComponent.sol";
import { CanNameComponent, ID as CanNameCompID } from "components/CanNameComponent.sol";
import { IdAccountComponent, ID as IdAccCompID } from "components/IdAccountComponent.sol";
import { IndexPetComponent, ID as IndexPetCompID } from "components/IndexPetComponent.sol";
import { IsPetComponent, ID as IsPetCompID } from "components/IsPetComponent.sol";
import { AffinityComponent, ID as AffinityCompID } from "components/AffinityComponent.sol";
import { ExperienceComponent, ID as ExperienceCompID } from "components/ExperienceComponent.sol";
import { HealthComponent, ID as HealthCompID } from "components/HealthComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { TimeLastActionComponent, ID as TimeLastActCompID } from "components/TimeLastActionComponent.sol";
import { TimeLastComponent, ID as TimeLastCompID } from "components/TimeLastComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibEquipment } from "libraries/LibEquipment.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibProduction } from "libraries/LibProduction.sol";
import { LibRegistryAffinity } from "libraries/LibRegistryAffinity.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";
import { LibRegistryTrait } from "libraries/LibRegistryTrait.sol";
import { LibSkill } from "libraries/LibSkill.sol";
import { LibStat } from "libraries/LibStat.sol";

// placeholders for config values
string constant UNREVEALED_URI = "https://kamigotchi.nyc3.cdn.digitaloceanspaces.com/placeholder.gif";

library LibPet {
  using LibFPMath for int256;

  ///////////////////////
  // ENTITY INTERACTIONS

  /// @notice create a pet entity and set its base fields
  function create(
    IWorld world,
    IUintComp components,
    uint256 accountID,
    uint32 index
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsPetComponent(getAddressById(components, IsPetCompID)).set(id);
    IndexPetComponent(getAddressById(components, IndexPetCompID)).set(id, index);
    setAccount(components, id, accountID);
    setMediaURI(components, id, UNREVEALED_URI);
    setState(components, id, "UNREVEALED");
    setStartTs(components, id, block.timestamp);

    LibExperience.setLevel(components, id, 1);
    LibExperience.set(components, id, 0);
    LibSkill.setPoints(components, id, 1);

    string memory name = LibString.concat("kamigotchi ", LibString.toString(index));
    setName(components, id, name);
    return id;
  }

  /// @notice called when a pet is revealed
  /// @dev most of the reveal logic (generation) is in the Pet721RevealSystem itself
  ///       this function is for components saved directly on the Pet Entity
  function reveal(IUintComp components, uint256 id, string memory uri) internal {
    setCanName(components, id, true);
    revive(components, id);
    setStats(components, id);
    setMediaURI(components, id, uri);
    setLastTs(components, id, block.timestamp);
  }

  /// @notice bridging a pet Outside => MUD. Does not handle account details
  function stake(IUintComp components, uint256 id, uint256 accountID) internal {
    setState(components, id, "RESTING");
    setAccount(components, id, accountID);
  }

  /// @notice bridging a pet MUD => Outside. Does not handle account details
  function unstake(IUintComp components, uint256 id) internal {
    setState(components, id, "721_EXTERNAL");
    setAccount(components, id, 0);
  }

  /// @notice put pet in gacha pool
  function toGacha(IUintComp components, uint256 id) internal {
    setState(components, id, "GACHA");
    IdAccountComponent(getAddressById(components, IdAccCompID)).remove(id);
  }

  /// @notice take pet out of gacha pool
  function fromGacha(IUintComp components, uint256 id, uint256 accountID) internal {
    setState(components, id, "RESTING");
    setAccount(components, id, accountID);
  }

  ///////////////////////
  // STATS INTERACTIONS

  // Drains HP from a pet. Opposite of healing
  function drain(IUintComp components, uint256 id, int32 amt) internal {
    if (amt == 0) return;
    HealthComponent(getAddressById(components, HealthCompID)).sync(id, -1 * amt);
  }

  // heal the pet by a given amount
  function heal(IUintComp components, uint256 id, int32 amt) internal {
    if (amt == 0) return; // skip if no healing
    int32 total = calcTotalHealth(components, id);
    HealthComponent(getAddressById(components, HealthCompID)).sync(id, amt, total);
  }

  // Update a pet's health to 0 and its state to DEAD
  function kill(IUintComp components, uint256 id) internal {
    StateComponent(getAddressById(components, StateCompID)).set(id, string("DEAD"));
    HealthComponent(getAddressById(components, HealthCompID)).sync(id, -(1 << 31));
  }

  // Update a pet's state to RESTING
  function revive(IUintComp components, uint256 id) internal {
    StateComponent(getAddressById(components, StateCompID)).set(id, string("RESTING"));
  }

  // Update the current health of a pet as well as any active production
  function sync(IUintComp components, uint256 id) public {
    string memory state = getState(components, id);

    if (LibString.eq(state, "HARVESTING")) {
      uint256 productionID = getProduction(components, id);
      uint256 deltaBalance = LibProduction.sync(components, productionID);
      uint256 damage = calcDrain(components, id, deltaBalance);
      drain(components, id, int32(int(damage)));
    } else if (LibString.eq(state, "RESTING")) {
      uint256 recovery = calcRestingRecovery(components, id);
      heal(components, id, int32(int(recovery)));
    }

    setLastTs(components, id, block.timestamp);
  }

  // transfer ERC721 pet
  // NOTE: transfers are disabled in game
  function transfer(IUintComp components, uint32 index, uint256 accountID) internal {
    // does not need to check for previous owner, ERC721 handles it
    uint256 id = getByIndex(components, index);
    setAccount(components, id, accountID);
  }

  /////////////////
  // CALCULATIONS

  // Calculate the affinity multiplier (1e2 precision) for attacks between two kamis
  function calcAttackAffinityMultiplier(
    IUintComp components,
    uint256 sourceID,
    uint256 targetID
  ) internal view returns (uint256) {
    string memory targetAff = getAffinities(components, targetID)[0];
    string memory sourceAff = getAffinities(components, sourceID)[1];
    return LibRegistryAffinity.getAttackMultiplier(components, sourceAff, targetAff);
  }

  // Calculate the reward for liquidating a specified Coin balance
  function calcBounty(
    IUintComp components,
    uint256 id, // unused atm, but will be used for skill multipliers
    uint256 amt
  ) internal view returns (uint256) {
    string[] memory configs = new string[](2);
    configs[0] = "LIQ_BOUNTY_BASE";
    configs[1] = "LIQ_BOUNTY_BASE_PREC";
    uint256[] memory configVals = LibConfig.getBatchValueOf(components, configs);

    uint256 base = configVals[0];
    uint256 precision = 10 ** configVals[1];
    return (amt * base) / precision;
  }

  // NOTE: consider using this for calcProductionDrain
  // Calculate the drain for a pet, based on coins received
  function calcDrain(
    IUintComp components,
    uint256 id,
    uint256 amt
  ) internal view returns (uint256) {
    string[] memory configs = new string[](2);
    configs[0] = "HEALTH_RATE_DRAIN_BASE";
    configs[1] = "HEALTH_RATE_DRAIN_BASE_PREC";
    uint256[] memory configVals = LibConfig.getBatchValueOf(components, configs);

    uint256 base = configVals[0];
    uint256 basePrecision = 10 ** configVals[1];
    uint256 multiplier = calcDrainMultiplier(components, id);
    uint256 totalPrecision = basePrecision * 1000; // 1000 from bonus multiplier
    return (amt * base * multiplier + (totalPrecision / 2)) / totalPrecision;
  }

  // get the total drain multiplier for receiving coins
  // defaults to 100/100 if not set for the pet
  function calcDrainMultiplier(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 bonusID = LibBonus.get(components, id, "HARVEST_DRAIN");
    uint256 bonusMult = LibBonus.getValue(components, bonusID);
    return bonusMult;
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
    string[] memory configs = new string[](3);
    configs[0] = "HEALTH_RATE_HEAL_PREC";
    configs[1] = "HEALTH_RATE_HEAL_BASE";
    configs[2] = "HEALTH_RATE_HEAL_BASE_PREC";
    uint256[] memory configVals = LibConfig.getBatchValueOf(components, configs);
    uint256 totalHarmony = uint(int(calcTotalHarmony(components, id)));

    uint256 precision = 10 ** configVals[0];
    uint256 base = configVals[1];
    uint256 basePrecision = 10 ** configVals[2];
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
    uint256 affinityMultiplierPrecision = 10 **
      LibConfig.getValueOf(components, "LIQ_THRESH_MULT_AFF_PREC");
    return (affinityMultiplier * baseThreshold) / affinityMultiplierPrecision; // adjust for affinity multiplier precision
  }

  // Calculate the base liquidation threshold for target pet, attacked by the source pet.
  // LT = .2 * Φ(ln(V_s / H_t)) (as proportion of total health with 1e18 precision).
  function calcThresholdBase(
    IUintComp components,
    uint256 sourceID,
    uint256 targetID
  ) internal view returns (uint256) {
    string[] memory configs = new string[](2);
    configs[0] = "LIQ_THRESH_BASE";
    configs[1] = "LIQ_THRESH_BASE_PREC";
    uint256[] memory configVals = LibConfig.getBatchValueOf(components, configs);

    uint256 base = configVals[0];
    uint256 basePrecision = 10 ** configVals[1];
    uint256 sourceViolence = uint(int(calcTotalViolence(components, sourceID)));
    uint256 targetHarmony = uint(int(calcTotalHarmony(components, targetID)));
    int256 ratio = int256((1e18 * sourceViolence) / targetHarmony);
    int256 weight = Gaussian.cdf(LibFPMath.lnWad(ratio));
    return (uint256(weight) * base) / basePrecision;
  }

  // Calculate and return the total harmony of a pet (including equips)
  // TODO: implement equipment stats with new stat shapes
  function calcTotalHarmony(IUintComp components, uint256 id) internal view returns (int32) {
    int32 total = LibStat.getHarmonyTotal(components, id);
    // uint256[] memory equipment = LibEquipment.getForPet(components, id);
    // for (uint256 i = 0; i < equipment.length; i++) {
    //   total += LibEquipment.getHarmony(components, equipment[i]);
    // }
    return total;
  }

  // Calculate and return the total health of a pet (including equips)
  // TODO: implement equipment stats with new stat shapes
  function calcTotalHealth(IUintComp components, uint256 id) internal view returns (int32) {
    int32 total = LibStat.getHealthTotal(components, id);

    // uint256[] memory equipment = LibEquipment.getForPet(components, id);
    // for (uint256 i = 0; i < equipment.length; i++) {
    //   total += LibEquipment.getHealth(components, equipment[i]);
    // }
    return total;
  }

  // Calculate and return the total power of a pet (including equips)
  // TODO: implement equipment stats with new stat shapes
  function calcTotalPower(IUintComp components, uint256 id) internal view returns (int32) {
    int32 total = LibStat.getPowerTotal(components, id);
    // uint256[] memory equipment = LibEquipment.getForPet(components, id);
    // for (uint256 i = 0; i < equipment.length; i++) {
    //   total += LibEquipment.getPower(components, equipment[i]);
    // }
    return total;
  }

  // Calculate and return the total violence of a pet (including equips)
  // TODO: implement equipment stats with new stat shapes
  function calcTotalViolence(IUintComp components, uint256 id) internal view returns (int32) {
    int32 total = LibStat.getViolenceTotal(components, id);
    // uint256[] memory equipment = LibEquipment.getForPet(components, id);
    // for (uint256 i = 0; i < equipment.length; i++) {
    //   total += LibEquipment.getViolence(components, equipment[i]);
    // }
    return total;
  }

  /////////////////
  // CHECKERS

  // check if the pet's account matches with target
  function assertAccount(
    IUintComp components,
    uint256 id,
    uint256 accountID
  ) internal view returns (bool) {
    return getAccount(components, id) == accountID;
  }

  // Check wether a pet can be named
  function canName(IUintComp components, uint256 id) internal view returns (bool) {
    return CanNameComponent(getAddressById(components, CanNameCompID)).has(id);
  }

  // Check whether a pet is attached to an account
  function hasAccount(IUintComp components, uint256 id) internal view returns (bool) {
    return IdAccountComponent(getAddressById(components, IdAccCompID)).has(id);
  }

  // Check whether a pet is dead.
  function isDead(IUintComp components, uint256 id) internal view returns (bool) {
    return LibString.eq(getState(components, id), "DEAD");
  }

  // Check whether the kami is fully healed.
  function isFull(IUintComp components, uint256 id) internal view returns (bool) {
    return calcTotalHealth(components, id) == LibStat.getHealth(components, id).sync;
  }

  // Check whether a pet is harvesting.
  function isHarvesting(IUintComp components, uint256 id) internal view returns (bool result) {
    return LibString.eq(getState(components, id), "HARVESTING");
  }

  // Check whether the current health of a pet is greater than 0. Assume health synced this block.
  function isHealthy(IUintComp components, uint256 id) internal view returns (bool) {
    return LibStat.getHealth(components, id).sync > 0;
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

  // Check whether a pet is on cooldown after its last Standard Action
  function onCooldown(IUintComp components, uint256 id) internal view returns (bool) {
    uint256 idleTime = block.timestamp - getLastActionTs(components, id);
    uint256 idleRequirement = LibConfig.getValueOf(components, "KAMI_IDLE_REQ");
    return idleTime < idleRequirement;
  }

  function assertAccountBatch(
    IUintComp components,
    uint256[] memory ids,
    uint256 accountID
  ) internal view returns (bool) {
    uint256[] memory accounts = getAccountBatch(components, ids);
    for (uint256 i = 0; i < ids.length; i++) {
      if (accounts[i] != accountID) return false;
    }
    return true;
  }

  function isPetBatch(IUintComp components, uint256[] memory ids) internal view returns (bool) {
    IsPetComponent comp = IsPetComponent(getAddressById(components, IsPetCompID));
    for (uint256 i = 0; i < ids.length; i++) {
      if (!comp.has(ids[i])) return false;
    }
    return true;
  }

  /////////////////
  // SETTERS

  function setAccount(IUintComp components, uint256 id, uint256 accountID) internal {
    IdAccountComponent(getAddressById(components, IdAccCompID)).set(id, accountID);
  }

  // add or remove the CanName component
  function setCanName(IUintComp components, uint256 id, bool can) internal {
    CanNameComponent canNameComp = CanNameComponent(getAddressById(components, CanNameCompID));
    if (can) canNameComp.set(id);
    else if (canNameComp.has(id)) canNameComp.remove(id);
  }

  // Update the TimeLastAction of a pet. to inform cooldown constraints on Standard Actions
  function setLastActionTs(IUintComp components, uint256 id, uint256 ts) internal {
    TimeLastActionComponent(getAddressById(components, TimeLastActCompID)).set(id, ts);
  }

  // Update the TimeLast of a pet. used as anchor point for updating Health
  function setLastTs(IUintComp components, uint256 id, uint256 ts) internal {
    TimeLastComponent(getAddressById(components, TimeLastCompID)).set(id, ts);
  }

  function setMediaURI(IUintComp components, uint256 id, string memory uri) internal {
    MediaURIComponent(getAddressById(components, MediaURICompID)).set(id, uri);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
  }

  function setStartTs(IUintComp components, uint256 id, uint256 timeStart) internal {
    TimeStartComponent(getAddressById(components, TimeStartCompID)).set(id, timeStart);
  }

  function setState(IUintComp components, uint256 id, string memory state) internal {
    StateComponent(getAddressById(components, StateCompID)).set(id, state);
  }

  // set a pet's stats from its traits
  function setStats(IUintComp components, uint256 id) internal {
    string[] memory configs = new string[](5);
    configs[0] = "KAMI_BASE_HEALTH";
    configs[1] = "KAMI_BASE_POWER";
    configs[2] = "KAMI_BASE_VIOLENCE";
    configs[3] = "KAMI_BASE_HARMONY";
    configs[4] = "KAMI_BASE_SLOTS";
    uint256[] memory configVals = LibConfig.getBatchValueOf(components, configs);
    int32 health = int32(int(configVals[0]));
    int32 power = int32(int(configVals[1]));
    int32 violence = int32(int(configVals[2]));
    int32 harmony = int32(int(configVals[3]));
    int32 slots = int32(int(configVals[4]));

    // sum the stats from all traits
    uint256 traitRegistryID;
    uint256[] memory traits = getTraits(components, id);
    for (uint256 i = 0; i < traits.length; i++) {
      traitRegistryID = traits[i];
      health += LibStat.getHealth(components, traitRegistryID).base;
      power += LibStat.getPower(components, traitRegistryID).base;
      violence += LibStat.getViolence(components, traitRegistryID).base;
      harmony += LibStat.getHarmony(components, traitRegistryID).base;
      slots += LibStat.getSlots(components, traitRegistryID).base;
    }

    // set the stats
    LibStat.setHealth(components, id, Stat(health, 0, 0, health));
    LibStat.setPower(components, id, Stat(power, 0, 0, 0));
    LibStat.setViolence(components, id, Stat(violence, 0, 0, 0));
    LibStat.setHarmony(components, id, Stat(harmony, 0, 0, 0));
    LibStat.setSlots(components, id, Stat(slots, 0, 0, slots));
  }

  /////////////////
  // GETTERS

  // get the index of a pet (aka its 721 tokenID) from its entity ID
  function getIndex(IUintComp components, uint256 entityID) internal view returns (uint32) {
    return IndexPetComponent(getAddressById(components, IndexPetCompID)).getValue(entityID);
  }

  // get the entity ID of the pet account
  function getAccount(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdAccountComponent(getAddressById(components, IdAccCompID)).getValue(id);
  }

  // null string might not be very useful, may be better for a has check
  function getAffinity(IUintComp components, uint256 id) internal view returns (string memory) {
    AffinityComponent comp = AffinityComponent(getAddressById(components, AffinityCompID));
    if (!comp.has(id)) return "";
    return comp.getValue(id);
  }

  // get the last time a kami commited a Standard Action
  function getLastActionTs(IUintComp components, uint256 id) internal view returns (uint256 ts) {
    TimeLastActionComponent comp = TimeLastActionComponent(
      getAddressById(components, TimeLastActCompID)
    );
    if (comp.has(id)) ts = comp.getValue(id);
  }

  // get the last time a kami commited a syncing Action
  function getLastTs(IUintComp components, uint256 id) internal view returns (uint256) {
    return TimeLastComponent(getAddressById(components, TimeLastCompID)).getValue(id);
  }

  // Get the implied roomIndex of a pet based on its state.
  function getRoom(IUintComp components, uint256 id) public view returns (uint32 roomIndex) {
    string memory state = getState(components, id);

    if (LibString.eq(state, "HARVESTING")) {
      uint256 productionID = getProduction(components, id);
      uint256 nodeID = LibProduction.getNode(components, productionID);
      roomIndex = LibNode.getRoom(components, nodeID);
    } else if (LibString.eq(state, "721_EXTERNAL")) {
      roomIndex = 0;
    } else {
      uint256 accountID = getAccount(components, id);
      roomIndex = LibAccount.getRoom(components, accountID);
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
    traits[0] = LibRegistryTrait.getBackgroundOf(components, id);
    traits[1] = LibRegistryTrait.getBodyOf(components, id);
    traits[2] = LibRegistryTrait.getColorOf(components, id);
    traits[3] = LibRegistryTrait.getFaceOf(components, id);
    traits[4] = LibRegistryTrait.getHandOf(components, id);
    return traits;
  }

  // Get the pet's affinities. hardcoded to check for body and hands.
  function getAffinities(IUintComp components, uint256 id) internal view returns (string[] memory) {
    string[] memory affinities = new string[](2);
    uint256 bodyRegistryID = LibRegistryTrait.getBodyOf(components, id);
    uint256 handRegistryID = LibRegistryTrait.getHandOf(components, id);
    affinities[0] = getAffinity(components, bodyRegistryID);
    affinities[1] = getAffinity(components, handRegistryID);
    return affinities;
  }

  function getAccountBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (uint256[] memory) {
    IdAccountComponent comp = IdAccountComponent(getAddressById(components, IdAccCompID));
    uint256[] memory results = new uint256[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      results[i] = comp.getValue(ids[i]);
    }
    return results;
  }

  /////////////////
  // QUERIES

  // get the entity ID of a pet from its index (tokenID)
  // NOTE: this looks unreliable if we use pet index to identify pets on other entities
  function getByIndex(IUintComp components, uint32 index) internal view returns (uint256 result) {
    uint256[] memory results = IndexPetComponent(getAddressById(components, IndexPetCompID))
      .getEntitiesWithValue(index);
    // assumes only 1 pet per index
    if (results.length > 0) {
      result = results[0];
    }
  }

  /// @notice retrieves the pet with the specified name
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

  /// @notice gets all the pets owned by an account
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

  /// @notice get all pets in the gacha pool
  function getAllInGacha(IUintComp components) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsPetCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, StateCompID),
      abi.encode("GACHA")
    );

    return LibQuery.query(fragments);
  }
}
