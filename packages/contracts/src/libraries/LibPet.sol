// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddrByID, getCompByID, addressToEntity } from "solecs/utils.sol";
import { Stat } from "components/types/Stat.sol";

import { AffinityComponent, ID as AffinityCompID } from "components/AffinityComponent.sol";
import { ExperienceComponent, ID as ExperienceCompID } from "components/ExperienceComponent.sol";
import { IDOwnsPetComponent, ID as IDOwnsPetCompID } from "components/IDOwnsPetComponent.sol";
import { IndexPetComponent, ID as IndexPetCompID } from "components/IndexPetComponent.sol";
import { IndexRoomComponent, ID as IndexRoomCompID } from "components/IndexRoomComponent.sol";
import { IsPetComponent, ID as IsPetCompID } from "components/IsPetComponent.sol";
import { HealthComponent, ID as HealthCompID } from "components/HealthComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { TimeLastActionComponent, ID as TimeLastActCompID } from "components/TimeLastActionComponent.sol";
import { TimeLastComponent, ID as TimeLastCompID } from "components/TimeLastComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibAffinity } from "libraries/utils/LibAffinity.sol";
import { LibBonusOld } from "libraries/LibBonusOld.sol";
import { LibComp } from "libraries/utils/LibComp.sol";
import { LibCooldown } from "libraries/utils/LibCooldown.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibFlag } from "libraries/LibFlag.sol";
import { LibData } from "libraries/LibData.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibHarvest } from "libraries/LibHarvest.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibTraitRegistry } from "libraries/LibTraitRegistry.sol";
import { LibSkill } from "libraries/LibSkill.sol";
import { LibStat } from "libraries/LibStat.sol";

// placeholders for config values
string constant UNREVEALED_URI = "https://kamigotchi.nyc3.cdn.digitaloceanspaces.com/placeholder.gif";
uint256 constant METABOLISM_PREC = 9;

library LibPet {
  using LibComp for IComponent;
  using LibString for string;
  using SafeCastLib for int32;
  using SafeCastLib for uint32;
  using SafeCastLib for int256;
  using SafeCastLib for uint256;

  ///////////////////////
  // ENTITY INTERACTIONS

  /// @notice create a pet entity and set its base fields
  /// @dev assumes index is not in use
  function create(IUintComp components, uint256 accID, uint32 index) internal returns (uint256) {
    uint256 id = genID(index);
    IsPetComponent(getAddrByID(components, IsPetCompID)).set(id); // TODO: change to EntityType
    IndexPetComponent(getAddrByID(components, IndexPetCompID)).set(id, index);
    setOwner(components, id, accID);
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
  function stake(IUintComp components, uint256 id, uint256 accID) internal {
    setState(components, id, "RESTING");
    setOwner(components, id, accID);
  }

  /// @notice bridging a pet MUD => Outside. Does not handle account details
  function unstake(IUintComp components, uint256 id) internal {
    setState(components, id, "721_EXTERNAL");
    setOwner(components, id, 0);
  }

  // Drains HP from a pet. Opposite of healing
  function drain(IUintComp components, uint256 id, int32 amt) internal {
    if (amt == 0) return;
    HealthComponent(getAddrByID(components, HealthCompID)).sync(id, -1 * amt);
  }

  // heal the pet by a given amount
  function heal(IUintComp components, uint256 id, int32 amt) internal {
    if (amt == 0) return; // skip if no healing
    int32 total = calcTotalHealth(components, id);
    HealthComponent(getAddrByID(components, HealthCompID)).sync(id, amt, total);
  }

  // Update a pet's health to 0 and its state to DEAD
  function kill(IUintComp components, uint256 id) internal {
    StateComponent(getAddrByID(components, StateCompID)).set(id, string("DEAD"));
    HealthComponent(getAddrByID(components, HealthCompID)).sync(id, -(1 << 31));
  }

  // Update a pet's state to RESTING
  function revive(IUintComp components, uint256 id) internal {
    StateComponent(getAddrByID(components, StateCompID)).set(id, string("RESTING"));
  }

  // Update the current health of a pet as well as any active production
  function sync(IUintComp components, uint256 id) internal {
    string memory state = getState(components, id);

    if (state.eq("HARVESTING")) {
      uint256 productionID = getProduction(components, id);
      uint256 deltaBalance = LibHarvest.sync(components, productionID);
      uint256 damage = calcStrain(components, id, deltaBalance);
      drain(components, id, damage.toInt32());
    } else if (state.eq("RESTING")) {
      uint256 recovery = calcRecovery(components, id);
      heal(components, id, recovery.toInt32());
    }

    setLastTs(components, id, block.timestamp);
  }

  // transfer ERC721 pet
  // NOTE: transfers are disabled in game
  function transfer(IUintComp components, uint32 index, uint256 accID) internal {
    // does not need to check for previous owner, ERC721 handles it
    uint256 id = getByIndex(components, index);
    setOwner(components, id, accID);
  }

  /////////////////
  // CALCULATIONS

  // Calculate resting recovery rate (HP/s) of a Kami. (1e9 precision)
  function calcMetabolism(IUintComp components, uint256 id) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_REST_METABOLISM");
    uint256 boostBonus = LibBonusOld.getRaw(components, id, "REST_METABOLISM_BOOST").toUint256();
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
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_HARV_STRAIN");
    int256 bonusBoost = LibBonusOld.getRaw(components, id, "STND_STRAIN_BOOST");
    uint256 core = config[2];
    uint256 boost = uint(config[6].toInt256() + bonusBoost);

    uint256 harmony = calcTotalHarmony(components, id).toUint256(); // prec 0
    uint256 precision = 10 ** uint(config[3] + config[7]);
    uint256 divisor = precision * (harmony + config[0]); // config[0] is hijacked

    return (amt * core * boost + (divisor - 1)) / divisor;
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

  /// @notice require that a pet is owned by an account
  /// @dev implicit isPet check - only pets are mapped to IDOwnsPetComponent
  function assertAccount(IUintComp components, uint256 id, uint256 accID) internal view {
    require(getCompByID(components, IDOwnsPetCompID).eqUint256(id, accID), "pet not urs");
  }

  function assertAccount(IUintComp components, uint256[] memory ids, uint256 accID) internal view {
    require(getCompByID(components, IDOwnsPetCompID).eqUint256(ids, accID), "pet not urs");
  }

  /// @notice require pet in same room as account
  function assertRoom(IUintComp components, uint256 petID, uint256 accID) internal view {
    string memory state = getState(components, petID);

    bool sameRoom;
    if (state.eq("HARVESTING")) {
      uint256 productionID = getProduction(components, petID);
      uint256 nodeID = LibHarvest.getNode(components, productionID);
      (uint32 petRoom, uint32 accRoom) = getCompByID(components, IndexRoomCompID).safeGetTwoUint32(
        nodeID,
        accID
      ); // pet is at nodeID
      sameRoom = petRoom == accRoom;
    } else if (state.eq("721_EXTERNAL")) {
      sameRoom = false; // outside
    } else sameRoom = true;

    require(sameRoom, "pet too far");
  }

  function assertRoom(IUintComp components, uint256 petID) internal view {
    return assertRoom(components, petID, getAccount(components, petID));
  }

  // Check whether a pet is dead.
  function isDead(IUintComp components, uint256 id) internal view returns (bool) {
    return getCompByID(components, StateCompID).eqString(id, "DEAD");
  }

  // Check whether the kami is fully healed.
  function isFull(IUintComp components, uint256 id) internal view returns (bool) {
    return calcTotalHealth(components, id) == LibStat.getHealth(components, id).sync;
  }

  // Check whether a pet is harvesting.
  function isHarvesting(IUintComp components, uint256 id) internal view returns (bool result) {
    return getCompByID(components, StateCompID).eqString(id, "HARVESTING");
  }

  // Check whether the current health of a pet is greater than 0. Assume health synced this block.
  function isHealthy(IUintComp components, uint256 id) internal view returns (bool) {
    return LibStat.getHealth(components, id).sync > 0;
  }

  // Check whether a pet's ERC721 token is in the game world
  function isInWorld(IUintComp components, uint256 id) internal view returns (bool) {
    return !getCompByID(components, StateCompID).eqString(id, "721_EXTERNAL");
  }

  // Check whether a pet is resting.
  function isResting(IUintComp components, uint256 id) internal view returns (bool) {
    return getCompByID(components, StateCompID).eqString(id, "RESTING");
  }

  function isResting(IUintComp components, uint256[] memory ids) internal view returns (bool) {
    return getCompByID(components, StateCompID).eqString(ids, "RESTING");
  }

  // Check whether a pet is on cooldown after its last Standard Action
  function onCooldown(IUintComp components, uint256 id) internal view returns (bool) {
    return LibCooldown.isActive(components, id);
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

  function setOwner(IUintComp components, uint256 id, uint256 accID) internal {
    IDOwnsPetComponent(getAddrByID(components, IDOwnsPetCompID)).set(id, accID);
  }

  // Update the TimeLastAction of a pet. to inform cooldown constraints on Standard Actions
  function setLastActionTs(IUintComp components, uint256 id, uint256 ts) internal {
    TimeLastActionComponent(getAddrByID(components, TimeLastActCompID)).set(id, ts);
  }

  // Update the TimeLast of a pet. used as anchor point for updating Health
  function setLastTs(IUintComp components, uint256 id, uint256 ts) internal {
    TimeLastComponent(getAddrByID(components, TimeLastCompID)).set(id, ts);
  }

  function setMediaURI(IUintComp components, uint256 id, string memory uri) internal {
    MediaURIComponent(getAddrByID(components, MediaURICompID)).set(id, uri);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddrByID(components, NameCompID)).set(id, name);
  }

  /// @dev using NOT_NAMEABLE flag
  function setNameable(IUintComp components, uint256 id, bool can) internal {
    LibFlag.set(components, id, "NOT_NAMEABLE", !can);
  }

  function setStartTs(IUintComp components, uint256 id, uint256 timeStart) internal {
    TimeStartComponent(getAddrByID(components, TimeStartCompID)).set(id, timeStart);
  }

  function setState(IUintComp components, uint256 id, string memory state) internal {
    StateComponent(getAddrByID(components, StateCompID)).set(id, state);
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
    return IndexPetComponent(getAddrByID(components, IndexPetCompID)).get(entityID);
  }

  // get the entity ID of the pet account
  function getAccount(IUintComp components, uint256 id) internal view returns (uint256) {
    return getCompByID(components, IDOwnsPetCompID).safeGetUint256(id);
  }

  // null string might not be very useful, may be better for a has check
  function getAffinity(IUintComp components, uint256 id) internal view returns (string memory) {
    return getCompByID(components, AffinityCompID).safeGetString(id);
  }

  // get the last time a kami commited a Standard Action
  function getLastActionTs(IUintComp components, uint256 id) internal view returns (uint256) {
    return getCompByID(components, TimeLastActCompID).safeGetUint256(id);
  }

  // get the last time a kami commited a syncing Action
  function getLastTs(IUintComp components, uint256 id) internal view returns (uint256) {
    return TimeLastComponent(getAddrByID(components, TimeLastCompID)).get(id);
  }

  // Get the implied roomIndex of a pet based on its state.
  function getRoom(IUintComp components, uint256 id) internal view returns (uint32 roomIndex) {
    string memory state = getState(components, id);

    if (state.eq("HARVESTING")) {
      uint256 productionID = getProduction(components, id);
      uint256 nodeID = LibHarvest.getNode(components, productionID);
      roomIndex = LibNode.getRoom(components, nodeID);
    } else if (state.eq("721_EXTERNAL")) {
      roomIndex = 0;
    } else {
      uint256 accID = getAccount(components, id);
      roomIndex = LibAccount.getRoom(components, accID);
    }
  }

  function getMediaURI(IUintComp components, uint256 id) internal view returns (string memory) {
    return MediaURIComponent(getAddrByID(components, MediaURICompID)).get(id);
  }

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddrByID(components, NameCompID)).get(id);
  }

  // get the entity ID of the pet owner
  function getOwner(IUintComp components, uint256 id) internal view returns (address) {
    uint256 accID = getAccount(components, id);
    return LibAccount.getOwner(components, accID);
  }

  // Get the production of a pet. Return 0 if there are none.
  function getProduction(IUintComp components, uint256 id) internal view returns (uint256) {
    return LibHarvest.getForPet(components, id);
  }

  function getState(IUintComp components, uint256 id) internal view returns (string memory) {
    return StateComponent(getAddrByID(components, StateCompID)).get(id);
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
    uint256[] memory regIDs = new uint256[](2);
    regIDs[0] = LibTraitRegistry.getBodyOf(components, id);
    regIDs[1] = LibTraitRegistry.getHandOf(components, id);
    return getCompByID(components, AffinityCompID).safeGetBatchString(regIDs);
  }

  /////////////////
  // QUERIES

  /// @notice get the entity ID of a pet from its index (tokenID)
  function getByIndex(IUintComp components, uint32 index) internal view returns (uint256) {
    uint256 id = genID(index);
    return IsPetComponent(getAddrByID(components, IsPetCompID)).has(id) ? id : 0; // TODO: change to EntityType
  }

  /// @notice retrieves the pet with the specified name
  function getByName(IUintComp components, string memory name) internal view returns (uint256) {
    uint256[] memory results = LibQuery.getIsWithValue(
      getCompByID(components, NameCompID),
      getCompByID(components, IsPetCompID),
      abi.encode(name)
    );
    return results.length > 0 ? results[0] : 0;
  }

  ////////////////////
  // LOGGING

  function logRevive(IUintComp components, uint256 id) internal {
    uint256 accID = LibPet.getAccount(components, id);
    LibData.inc(components, accID, 0, "KAMI_REVIVE", 1);
  }

  function logNameChange(IUintComp components, uint256 accID) internal {
    LibData.inc(components, accID, 0, "KAMI_NAME", 1);
  }

  ////////////////////
  // UTILS

  function genID(uint32 petIndex) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("pet.id", petIndex)));
  }
}
