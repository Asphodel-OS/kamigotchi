// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById, addressToEntity } from "solecs/utils.sol";
import { Stat } from "components/types/Stat.sol";

import { CanNameComponent, ID as CanNameCompID } from "components/CanNameComponent.sol";
import { IDOwnsPetComponent, ID as IDOwnsPetCompID } from "components/IDOwnsPetComponent.sol";
import { IndexPetComponent, ID as IndexPetCompID } from "components/IndexPetComponent.sol";
import { IsPetComponent, ID as IsPetCompID } from "components/IsPetComponent.sol";
import { AffinityComponent, ID as AffinityCompID } from "components/AffinityComponent.sol";
import { ExperienceComponent, ID as ExperienceCompID } from "components/ExperienceComponent.sol";
import { HealthComponent, ID as HealthCompID } from "components/HealthComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { TimeLastActionComponent, ID as TimeLastActCompID } from "components/TimeLastActionComponent.sol";
import { TimeLastComponent, ID as TimeLastCompID } from "components/TimeLastComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibAffinity } from "libraries/LibAffinity.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibFlag } from "libraries/LibFlag.sol";
import { LibGacha, GACHA_ID } from "libraries/LibGacha.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibHarvest } from "libraries/LibHarvest.sol";
import { LibItemRegistry } from "libraries/LibItemRegistry.sol";
import { LibTraitRegistry } from "libraries/LibTraitRegistry.sol";
import { LibSkill } from "libraries/LibSkill.sol";
import { LibStat } from "libraries/LibStat.sol";
import { Gaussian } from "utils/Gaussian.sol";

// placeholders for config values
string constant UNREVEALED_URI = "https://kamigotchi.nyc3.cdn.digitaloceanspaces.com/placeholder.gif";
uint256 constant METABOLISM_PREC = 9;

library LibPet {
  using SafeCastLib for int32;
  using SafeCastLib for uint32;
  using SafeCastLib for int256;
  using SafeCastLib for uint256;

  ///////////////////////
  // ENTITY INTERACTIONS

  /// @notice create a pet entity and set its base fields
  /// @dev assumes index is not in use
  function create(
    IUintComp components,
    uint256 accountID,
    uint32 index
  ) internal returns (uint256) {
    uint256 id = genID(index);
    IsPetComponent(getAddressById(components, IsPetCompID)).set(id);
    IndexPetComponent(getAddressById(components, IndexPetCompID)).set(id, index);
    setOwner(components, id, accountID);
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
    revive(components, id);
    setStats(components, id);
    setMediaURI(components, id, uri);
    setLastTs(components, id, block.timestamp);
  }

  /// @notice bridging a pet Outside => MUD. Does not handle account details
  function stake(IUintComp components, uint256 id, uint256 accountID) internal {
    setState(components, id, "RESTING");
    setOwner(components, id, accountID);
  }

  /// @notice bridging a pet MUD => Outside. Does not handle account details
  function unstake(IUintComp components, uint256 id) internal {
    setState(components, id, "721_EXTERNAL");
    setOwner(components, id, 0);
  }

  // Drains HP from a pet. Opposite of healing
  function drain(IUintComp components, uint256 id, int32 amt) internal {
    if (amt == 0) return;
    HealthComponent(getAddressById(components, HealthCompID)).sync(id, -1 * amt);
  }

  // apply the effects of a consumable item to the pet
  // assume all requisite checks are run in advance
  // TODO: add support for experience, revives and holy dust
  function feed(IUintComp components, uint256 id, uint32 itemIndex) internal {
    uint256 registryID = LibItemRegistry.getByIndex(components, itemIndex);
    string memory type_ = LibItemRegistry.getType(components, registryID);

    // handle revives
    if (LibString.eq(type_, "REVIVE") && isDead(components, id)) {
      revive(components, id);
      LibPet.logRevive(components, id);
    }

    // handle experience boosts
    if (LibExperience.has(components, registryID)) {
      LibExperience.inc(components, id, LibExperience.get(components, registryID));
    }

    LibStat.applyy(components, registryID, id);
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
      uint256 maxFarm = calcStrainBountyCap(components, id);
      uint256 deltaBalance = LibHarvest.sync(components, productionID, maxFarm);
      uint256 damage = calcStrain(components, id, deltaBalance);
      drain(components, id, damage.toInt32());
    } else if (LibString.eq(state, "RESTING")) {
      uint256 recovery = calcRecovery(components, id);
      heal(components, id, recovery.toInt32());
    }

    setLastTs(components, id, block.timestamp);
  }

  // transfer ERC721 pet
  // NOTE: transfers are disabled in game
  function transfer(IUintComp components, uint32 index, uint256 accountID) internal {
    // does not need to check for previous owner, ERC721 handles it
    uint256 id = getByIndex(components, index);
    setOwner(components, id, accountID);
  }

  /////////////////
  // CALCULATIONS

  // Calculate the full cooldown duration of a Kami's Standard Action
  function calcCooldown(IUintComp components, uint256 id) internal view returns (uint256) {
    int256 base = LibConfig.get(components, "KAMI_STANDARD_COOLDOWN").toInt256();
    int256 shift = LibBonus.getRaw(components, id, "STND_COOLDOWN_SHIFT");
    int256 cooldown = base + shift;
    if (cooldown < 0) return 0;
    return cooldown.toUint256();
  }

  // Calculate resting recovery rate (HP/s) of a Kami. (1e9 precision)
  function calcMetabolism(IUintComp components, uint256 id) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_REST_METABOLISM");
    uint256 boostBonus = LibBonus.getRaw(components, id, "REST_METABOLISM_BOOST").toUint256();
    uint256 base = calcTotalHarmony(components, id).toUint256();
    uint256 ratio = config[2]; // metabolism core
    uint256 boost = config[6] + boostBonus;
    uint256 precision = 10 ** (METABOLISM_PREC - (config[3] + config[7]));
    uint256 metabolism = (precision * base * ratio * boost) / 3600;
    return (metabolism);
  }

  // Calculate resting recovery (HP) of a Kami. This assume Kami is resting. Round down.
  function calcRecovery(IUintComp components, uint256 id) internal view returns (uint256) {
    uint256 rate = calcMetabolism(components, id);
    uint256 duration = block.timestamp - getLastTs(components, id);
    return (duration * rate) / (10 ** METABOLISM_PREC);
  }

  // Calculate the HP strain on pet from accrual of musu. Round up.
  function calcStrain(
    IUintComp components,
    uint256 id,
    uint256 amt
  ) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_MUSU_STRAIN");
    int256 bonusBoost = LibBonus.getRaw(components, id, "STND_STRAIN_BOOST");
    uint256 core = config[2];
    uint256 boost = uint(config[6].toInt256() + bonusBoost);
    uint256 precision = 10 ** uint(config[3] + config[7]);
    return (amt * core * boost + (precision - 1)) / precision;
  }

  // Calculate the max musu a kami can farm based on its hp at the last
  // harvest sync against its rate of strain per musu. Round down.
  function calcStrainBountyCap(IUintComp components, uint256 id) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_MUSU_STRAIN");
    int256 bonusBoost = LibBonus.getRaw(components, id, "STND_STRAIN_BOOST");
    uint256 healthBudget = LibStat.getHealth(components, id).sync.toUint256();
    uint256 core = config[2];
    uint256 boost = uint(config[6].toInt256() + bonusBoost);
    uint256 precision = 10 ** uint(config[3] + config[7]);
    return (healthBudget * precision) / (core * boost);
  }

  /////////////////
  // STAT CALCS
  // TODO: implement equipment stats with new stat shapes

  // Calculate and return the total harmony of a pet (including equips)
  function calcTotalHarmony(IUintComp components, uint256 id) internal view returns (int32) {
    int32 total = LibStat.getHarmonyTotal(components, id);
    // uint256[] memory equipment = LibEquipment.getForPet(components, id);
    // for (uint256 i = 0; i < equipment.length; i++) {
    //   total += LibEquipment.getHarmony(components, equipment[i]);
    // }
    return total;
  }

  // Calculate and return the total health of a pet (including equips)
  function calcTotalHealth(IUintComp components, uint256 id) internal view returns (int32) {
    int32 total = LibStat.getHealthTotal(components, id);

    // uint256[] memory equipment = LibEquipment.getForPet(components, id);
    // for (uint256 i = 0; i < equipment.length; i++) {
    //   total += LibEquipment.getHealth(components, equipment[i]);
    // }
    return total;
  }

  // Calculate and return the total power of a pet (including equips)
  function calcTotalPower(IUintComp components, uint256 id) internal view returns (int32) {
    int32 total = LibStat.getPowerTotal(components, id);
    // uint256[] memory equipment = LibEquipment.getForPet(components, id);
    // for (uint256 i = 0; i < equipment.length; i++) {
    //   total += LibEquipment.getPower(components, equipment[i]);
    // }
    return total;
  }

  // Calculate and return the total violence of a pet (including equips)
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

  // Check whether a pet is attached to an account
  function hasAccount(IUintComp components, uint256 id) internal view returns (bool) {
    return IDOwnsPetComponent(getAddressById(components, IDOwnsPetCompID)).has(id);
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
    uint256 idleRequirement = calcCooldown(components, id);
    return idleTime <= idleRequirement;
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

  function assertStateBatch(
    IUintComp components,
    uint256[] memory ids,
    string memory state
  ) internal view returns (bool) {
    StateComponent comp = StateComponent(getAddressById(components, StateCompID));
    for (uint256 i = 0; i < ids.length; i++)
      if (!LibString.eq(comp.get(ids[i]), state)) return false;
    return true;
  }

  function isPetBatch(IUintComp components, uint256[] memory ids) internal view returns (bool) {
    IsPetComponent comp = IsPetComponent(getAddressById(components, IsPetCompID));
    for (uint256 i = 0; i < ids.length; i++) {
      if (!comp.has(ids[i])) return false;
    }
    return true;
  }

  /// @notice Check if a pet can be named, rename
  /**  @dev
   * checks for NOT_NAMEABLE flag
   * inverse check for upgradability shapes & to save gas on pet creation
   */
  function useNameable(IUintComp components, uint256 id) internal returns (bool) {
    return !LibFlag.getAndSet(components, id, "NOT_NAMEABLE", true);
  }

  /////////////////
  // SETTERS

  function setOwner(IUintComp components, uint256 id, uint256 accountID) internal {
    IDOwnsPetComponent(getAddressById(components, IDOwnsPetCompID)).set(id, accountID);
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

  /// @dev using NOT_NAMEABLE flag
  function setNameable(IUintComp components, uint256 id, bool can) internal {
    LibFlag.set(components, id, "NOT_NAMEABLE", !can);
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
    uint256[] memory configVals = LibConfig.getBatch(components, configs);
    int32 health = configVals[0].toInt32();
    int32 power = configVals[1].toInt32();
    int32 violence = configVals[2].toInt32();
    int32 harmony = configVals[3].toInt32();
    int32 slots = configVals[4].toInt32();

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
    return IndexPetComponent(getAddressById(components, IndexPetCompID)).get(entityID);
  }

  // get the entity ID of the pet account
  function getAccount(IUintComp components, uint256 id) internal view returns (uint256) {
    return IDOwnsPetComponent(getAddressById(components, IDOwnsPetCompID)).get(id);
  }

  // null string might not be very useful, may be better for a has check
  function getAffinity(IUintComp components, uint256 id) internal view returns (string memory) {
    AffinityComponent comp = AffinityComponent(getAddressById(components, AffinityCompID));
    if (!comp.has(id)) return "";
    return comp.get(id);
  }

  // get the last time a kami commited a Standard Action
  function getLastActionTs(IUintComp components, uint256 id) internal view returns (uint256 ts) {
    TimeLastActionComponent comp = TimeLastActionComponent(
      getAddressById(components, TimeLastActCompID)
    );
    if (comp.has(id)) ts = comp.get(id);
  }

  // get the last time a kami commited a syncing Action
  function getLastTs(IUintComp components, uint256 id) internal view returns (uint256) {
    return TimeLastComponent(getAddressById(components, TimeLastCompID)).get(id);
  }

  // Get the implied roomIndex of a pet based on its state.
  function getRoom(IUintComp components, uint256 id) public view returns (uint32 roomIndex) {
    string memory state = getState(components, id);

    if (LibString.eq(state, "HARVESTING")) {
      uint256 productionID = getProduction(components, id);
      uint256 nodeID = LibHarvest.getNode(components, productionID);
      roomIndex = LibNode.getRoom(components, nodeID);
    } else if (LibString.eq(state, "721_EXTERNAL")) {
      roomIndex = 0;
    } else {
      uint256 accountID = getAccount(components, id);
      roomIndex = LibAccount.getRoom(components, accountID);
    }
  }

  function getMediaURI(IUintComp components, uint256 id) internal view returns (string memory) {
    return MediaURIComponent(getAddressById(components, MediaURICompID)).get(id);
  }

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddressById(components, NameCompID)).get(id);
  }

  // get the entity ID of the pet owner
  function getOwner(IUintComp components, uint256 id) internal view returns (address) {
    uint256 accountID = getAccount(components, id);
    return LibAccount.getOwner(components, accountID);
  }

  // Get the production of a pet. Return 0 if there are none.
  function getProduction(IUintComp components, uint256 id) internal view returns (uint256) {
    return LibHarvest.getForPet(components, id);
  }

  function getState(IUintComp components, uint256 id) internal view returns (string memory) {
    return StateComponent(getAddressById(components, StateCompID)).get(id);
  }

  // Get the traits of a pet, specifically the list of trait registry IDs
  function getTraits(IUintComp components, uint256 id) internal view returns (uint256[] memory) {
    uint256[] memory traits = new uint256[](5);
    traits[0] = LibTraitRegistry.getBackgroundOf(components, id);
    traits[1] = LibTraitRegistry.getBodyOf(components, id);
    traits[2] = LibTraitRegistry.getColorOf(components, id);
    traits[3] = LibTraitRegistry.getFaceOf(components, id);
    traits[4] = LibTraitRegistry.getHandOf(components, id);
    return traits;
  }

  // Get the pet's affinities. hardcoded to check for body and hands.
  function getAffinities(IUintComp components, uint256 id) internal view returns (string[] memory) {
    string[] memory affinities = new string[](2);
    uint256 bodyRegistryID = LibTraitRegistry.getBodyOf(components, id);
    uint256 handRegistryID = LibTraitRegistry.getHandOf(components, id);
    affinities[0] = getAffinity(components, bodyRegistryID);
    affinities[1] = getAffinity(components, handRegistryID);
    return affinities;
  }

  function getAccountBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (uint256[] memory) {
    IDOwnsPetComponent comp = IDOwnsPetComponent(getAddressById(components, IDOwnsPetCompID));
    uint256[] memory results = new uint256[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      results[i] = comp.get(ids[i]);
    }
    return results;
  }

  /////////////////
  // QUERIES

  /// @notice get the entity ID of a pet from its index (tokenID)
  function getByIndex(IUintComp components, uint32 index) internal view returns (uint256) {
    uint256 id = genID(index);
    return isPet(components, id) ? id : 0;
  }

  /// @notice retrieves the pet with the specified name
  function getByName(IUintComp components, string memory name) internal view returns (uint256) {
    uint256[] memory results = LibQuery.getIsWithValue(
      getComponentById(components, NameCompID),
      getComponentById(components, IsPetCompID),
      abi.encode(name)
    );
    return results.length > 0 ? results[0] : 0;
  }

  /// @notice gets all the pets owned by an account
  function getAllForAccount(
    IUintComp components,
    uint256 accountID
  ) internal view returns (uint256[] memory) {
    return
      LibQuery.getIsWithValue(
        getComponentById(components, IDOwnsPetCompID),
        getComponentById(components, IsPetCompID),
        abi.encode(accountID)
      );
  }

  ////////////////////
  // LOGGING

  function logRevive(IUintComp components, uint256 id) internal {
    uint256 accountID = LibPet.getAccount(components, id);
    LibDataEntity.inc(components, accountID, 0, "KAMI_REVIVE", 1);
  }

  function logNameChange(IUintComp components, uint256 accountID) internal {
    LibDataEntity.inc(components, accountID, 0, "KAMI_NAME", 1);
  }

  ////////////////////
  // UTILS

  function genID(uint32 petIndex) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("pet.id", petIndex)));
  }
}
