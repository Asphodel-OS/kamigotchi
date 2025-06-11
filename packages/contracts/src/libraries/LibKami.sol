// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { Stat } from "solecs/components/types/Stat.sol";

import { AffinityComponent, ID as AffinityCompID } from "components/AffinityComponent.sol";
import { IDOwnsKamiComponent, ID as IDOwnsKamiCompID } from "components/IDOwnsKamiComponent.sol";
import { IndexKamiComponent, ID as IndexKamiCompID } from "components/IndexKamiComponent.sol";
import { IndexRoomComponent, ID as IndexRoomCompID } from "components/IndexRoomComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { TimeLastActionComponent, ID as TimeLastActCompID } from "components/TimeLastActionComponent.sol";
import { TimeLastComponent, ID as TimeLastCompID } from "components/TimeLastComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibCooldown } from "libraries/utils/LibCooldown.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibFlag } from "libraries/LibFlag.sol";
import { LibData } from "libraries/LibData.sol";
import { LibNode } from "libraries/LibNode.sol";
import { LibHarvest } from "libraries/LibHarvest.sol";
import { LibTraitRegistry } from "libraries/LibTraitRegistry.sol";
import { LibStat } from "libraries/LibStat.sol";

// placeholders for config values
uint256 constant METABOLISM_PREC = 9;

// when needed, converts state to uint. do not change order - its live
enum KamiState {
  NULL,
  RESTING,
  HARVESTING,
  DEAD,
  EXTERNAL_721
}

/**
 * @notice library kamis!
 *
 * Shape: refer to LibKamiCreate
 * - Flags
 *   - NOT_NAMABLE: default false (kamis can be named by default)
 */
library LibKami {
  using LibComp for IComponent;
  using LibString for string;
  using SafeCastLib for int32;
  using SafeCastLib for uint32;
  using SafeCastLib for int256;
  using SafeCastLib for uint256;

  ///////////////////////
  // INTERACTIONS

  // Drains HP from a kami. Opposite of healing
  function drain(IUintComp components, uint256 id, int32 amt) internal {
    if (amt == 0) return;
    LibStat.sync(components, "HEALTH", -1 * amt, id);
  }

  // heal the kami by a given amount
  function heal(IUintComp components, uint256 id, int32 amt) internal {
    if (amt == 0) return;
    LibStat.sync(components, "HEALTH", amt, id);
  }

  // Update a kami's health to 0 and its state to DEAD
  function kill(IUintComp components, uint256 id) internal {
    StateComponent(getAddrByID(components, StateCompID)).set(id, string("DEAD"));
    LibStat.setSyncZero(components, "HEALTH", id);
  }

  // Update the current health of a kami as well as any active harvest
  function sync(IUintComp components, uint256 id) public {
    _sync(components, getState(components, id), id);
    setLastTs(components, id, block.timestamp);
  }

  function sync(IUintComp components, uint256[] memory ids) public {
    string[] memory states = StateComponent(getAddrByID(components, StateCompID)).get(ids);
    for (uint256 i; i < ids.length; i++) _sync(components, states[i], ids[i]);
    setLastTs(components, ids, block.timestamp);
  }

  function _sync(IUintComp components, string memory state, uint256 id) public {
    if (state.eq("HARVESTING")) {
      uint256 deltaBalance = LibHarvest.sync(components, getHarvest(components, id));
      uint256 damage = calcStrain(components, id, deltaBalance);
      drain(components, id, damage.toInt32());
    } else if (state.eq("RESTING")) {
      uint256 recovery = calcRecovery(components, id);
      heal(components, id, recovery.toInt32());
    }
  }

  /////////////////
  // FLAGS

  /// @notice Check if a kami can be named, rename
  /**  @dev
   * checks for NOT_NAMEABLE flag
   * inverse check for upgradability shapes & to save gas on kami creation
   */
  function useNameable(IUintComp components, uint256 id) internal returns (bool) {
    return !LibFlag.getAndSet(components, id, "NOT_NAMEABLE", true);
  }

  /// @dev using NOT_NAMEABLE flag
  function setNameable(IUintComp components, uint256 id, bool can) internal {
    LibFlag.set(components, id, "NOT_NAMEABLE", !can);
  }

  ////////////////
  // HARVESTS

  /// @dev only resets if harvesting
  function resetIntensity(IUintComp components, uint256 id) internal {
    if (isState(components, id, "HARVESTING")) {
      LibHarvest.resetIntensity(components, getHarvest(components, id));
    }
  }

  /////////////////
  // CALCULATIONS

  // Calculate resting recovery rate (HP/s) of a Kami. (1e9 precision)
  function calcMetabolism(IUintComp components, uint256 id) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_REST_METABOLISM");
    uint256 boostBonus = LibBonus.getFor(components, "REST_METABOLISM_BOOST", id).toUint256();
    uint256 base = LibStat.getTotal(components, "HARMONY", id).toUint256();
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

  // Calculate the HP strain on kami from accrual of musu. Round up.
  function calcStrain(
    IUintComp components,
    uint256 id,
    uint256 amt
  ) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(components, "KAMI_HARV_STRAIN");
    int256 bonusBoost = LibBonus.getFor(components, "STND_STRAIN_BOOST", id);
    uint256 core = config[2];
    uint256 boost = uint(config[6].toInt256() + bonusBoost);

    uint256 harmony = LibStat.getTotal(components, "HARMONY", id).toUint256(); // prec 0
    uint256 precision = 10 ** uint(config[3] + config[7]);
    uint256 divisor = precision * (harmony + config[0]); // config[0] is hijacked

    return (amt * core * boost + (divisor - 1)) / divisor;
  }

  /////////////////
  // CHECKERS

  /// @notice revert if  a kami is not owned by an account
  /// @dev implicit isKami check - only kamis are mapped to IDOwnsKamiComponent
  function verifyAccount(IUintComp components, uint256 id, uint256 accID) public view {
    if (IDOwnsKamiComponent(getAddrByID(components, IDOwnsKamiCompID)).get(id) != accID)
      revert("kami not urs");
  }

  function verifyAccount(IUintComp components, uint256[] memory ids, uint256 accID) public view {
    uint256[] memory accs = IDOwnsKamiComponent(getAddrByID(components, IDOwnsKamiCompID)).get(ids);
    for (uint256 i; i < ids.length; i++) if (accs[i] != accID) revert("kami not urs");
  }

  function verifyCooldown(IUintComp components, uint256 id) public view {
    if (LibCooldown.isActive(components, id)) revert("kami on cooldown");
  }

  function verifyCooldown(IUintComp components, uint256[] memory ids) public view {
    if (LibCooldown.isActive(components, ids)) revert("kami on cooldown");
  }

  function verifyHealthy(IUintComp components, uint256 id) public view {
    if (!isHealthy(components, id)) revert("kami starving..");
  }

  function verifyHealthy(IUintComp components, uint256[] memory ids) public view {
    if (!isHealthy(components, ids)) revert("kami starving..");
  }

  function verifyRoom(IUintComp components, uint256 kamiID, uint256 accID) public view {
    return _verifyRoom(components, getState(components, kamiID), kamiID, accID);
  }

  function verifyRoom(IUintComp components, uint256[] memory kamiIDs, uint256 accID) public view {
    string[] memory states = StateComponent(getAddrByID(components, StateCompID)).get(kamiIDs);
    for (uint256 i; i < kamiIDs.length; i++) _verifyRoom(components, states[i], kamiIDs[i], accID);
  }

  /// @notice revert if kami is not in same room as account
  function _verifyRoom(
    IUintComp components,
    string memory state,
    uint256 kamiID,
    uint256 accID
  ) public view {
    bool sameRoom;
    if (state.eq("HARVESTING")) {
      uint256 nodeID = LibHarvest.getNode(components, getHarvest(components, kamiID));
      IndexRoomComponent roomComp = IndexRoomComponent(getAddrByID(components, IndexRoomCompID));
      sameRoom = roomComp.safeGet(nodeID) == roomComp.safeGet(accID);
    } else if (state.eq("721_EXTERNAL")) {
      sameRoom = false; // outside
    } else sameRoom = true;

    if (!sameRoom) revert("kami too far");
  }

  function verifyRoom(IUintComp components, uint256 kamiID) public view {
    return verifyRoom(components, kamiID, getAccount(components, kamiID));
  }

  function verifyState(IUintComp components, uint256 id, string memory state) public view {
    if (!getCompByID(components, StateCompID).eqString(id, state))
      revert(LibString.concat("kami not ", state));
  }

  function verifyState(
    IUintComp components,
    uint256[] memory ids,
    string memory state
  ) public view {
    if (!getCompByID(components, StateCompID).eqString(ids, state))
      revert(LibString.concat("kami not ", state));
  }

  function isState(
    IUintComp components,
    uint256 id,
    string memory state
  ) internal view returns (bool) {
    return getCompByID(components, StateCompID).eqString(id, state);
  }

  // Check whether the current health of a kami is greater than 0. Assume health synced this block.
  function isHealthy(IUintComp components, uint256 id) internal view returns (bool) {
    return LibStat.get(components, "HEALTH", id).sync > 0;
  }

  function isHealthy(IUintComp components, uint256[] memory ids) internal view returns (bool) {
    Stat[] memory stats = LibStat.get(components, "HEALTH", ids);
    for (uint256 i; i < ids.length; i++) {
      if (stats[i].sync <= 0) return false;
    }
    return true;
  }

  // Check whether a kami's ERC721 token is in the game world
  function isInWorld(IUintComp components, uint256 id) internal view returns (bool) {
    return !getCompByID(components, StateCompID).eqString(id, "721_EXTERNAL");
  }

  /////////////////
  // SETTERS

  function setOwner(IUintComp components, uint256 id, uint256 accID) internal {
    IDOwnsKamiComponent(getAddrByID(components, IDOwnsKamiCompID)).set(id, accID);
  }

  // Update the TimeLastAction of a kami. to inform cooldown constraints on Standard Actions
  function setLastActionTs(IUintComp components, uint256 id, uint256 ts) internal {
    TimeLastActionComponent(getAddrByID(components, TimeLastActCompID)).set(id, ts);
  }

  function setLastActionTs(IUintComp components, uint256[] memory ids, uint256 ts) internal {
    getCompByID(components, TimeLastActCompID).setAll(ids, ts);
  }

  // Update the TimeLast of a kami. used as anchor point for updating Health
  function setLastTs(IUintComp components, uint256 id, uint256 ts) internal {
    TimeLastComponent(getAddrByID(components, TimeLastCompID)).set(id, ts);
  }

  function setLastTs(IUintComp components, uint256[] memory ids, uint256 ts) internal {
    getCompByID(components, TimeLastCompID).setAll(ids, ts);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddrByID(components, NameCompID)).set(id, name);
  }

  function setState(IUintComp components, uint256 id, string memory state) internal {
    StateComponent(getAddrByID(components, StateCompID)).set(id, state);
  }

  function setState(IUintComp components, uint256[] memory ids, string memory state) internal {
    getCompByID(components, StateCompID).setAll(ids, state);
  }

  function setStateFromIndex(IUintComp components, uint32 index, uint256 id) internal {
    StateComponent(getAddrByID(components, StateCompID)).set(id, indexToState(index));
  }

  /////////////////
  // GETTERS

  // get the index of a kami (aka its 721 tokenID) from its entity ID
  function getIndex(IUintComp components, uint256 entityID) internal view returns (uint32) {
    return IndexKamiComponent(getAddrByID(components, IndexKamiCompID)).get(entityID);
  }

  // get the entity ID of the kami account
  function getAccount(IUintComp components, uint256 id) internal view returns (uint256) {
    return IDOwnsKamiComponent(getAddrByID(components, IDOwnsKamiCompID)).safeGet(id);
  }

  // get the last time a kami commited a Standard Action
  function getLastActionTs(IUintComp components, uint256 id) internal view returns (uint256) {
    return TimeLastActionComponent(getAddrByID(components, TimeLastActCompID)).safeGet(id);
  }

  // get the last time a kami commited a syncing Action
  function getLastTs(IUintComp components, uint256 id) internal view returns (uint256) {
    return TimeLastComponent(getAddrByID(components, TimeLastCompID)).safeGet(id);
  }

  // Get the implied roomIndex of a kami based on its state.
  function getRoom(IUintComp components, uint256 id) internal view returns (uint32 roomIndex) {
    string memory state = getState(components, id);

    if (state.eq("HARVESTING")) {
      uint256 harvestID = getHarvest(components, id);
      uint256 nodeID = LibHarvest.getNode(components, harvestID);
      roomIndex = LibNode.getRoom(components, nodeID);
    } else if (state.eq("721_EXTERNAL")) {
      roomIndex = 0;
    } else {
      uint256 accID = getAccount(components, id);
      roomIndex = LibAccount.getRoom(components, accID);
    }
  }

  // get the entity ID of the kami owner
  function getOwner(IUintComp components, uint256 id) internal view returns (address) {
    uint256 accID = getAccount(components, id);
    return LibAccount.getOwner(components, accID);
  }

  // Get the harvest of a kami. Return 0 if there are none.
  function getHarvest(IUintComp components, uint256 id) internal view returns (uint256) {
    return LibHarvest.getForKami(components, id);
  }

  function getState(IUintComp components, uint256 id) internal view returns (string memory) {
    return StateComponent(getAddrByID(components, StateCompID)).get(id);
  }

  function getStateIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return stateToIndex(getState(components, id));
  }

  // Get the traits of a kami, specifically the list of trait registry IDs
  function getTraits(IUintComp components, uint256 id) internal view returns (uint256[] memory) {
    uint256[] memory traits = new uint256[](5);
    traits[0] = LibTraitRegistry.getByEntity(components, id, "FACE");
    traits[1] = LibTraitRegistry.getByEntity(components, id, "HAND");
    traits[2] = LibTraitRegistry.getByEntity(components, id, "BODY");
    traits[3] = LibTraitRegistry.getByEntity(components, id, "BACKGROUND");
    traits[4] = LibTraitRegistry.getByEntity(components, id, "COLOR");
    return traits;
  }

  // Get the kami's affinities. hardcoded to check for body and hands.
  function getAffinities(IUintComp components, uint256 id) internal view returns (string[] memory) {
    uint256[] memory regIDs = new uint256[](2);
    regIDs[0] = LibTraitRegistry.getByEntity(components, id, "BODY");
    regIDs[1] = LibTraitRegistry.getByEntity(components, id, "HAND");
    return AffinityComponent(getAddrByID(components, AffinityCompID)).safeGet(regIDs);
  }

  function getBodyAffinity(IUintComp components, uint256 id) internal view returns (string memory) {
    uint256 regID = LibTraitRegistry.getByEntity(components, id, "BODY");
    return AffinityComponent(getAddrByID(components, AffinityCompID)).safeGet(regID);
  }

  function getHandAffinity(IUintComp components, uint256 id) internal view returns (string memory) {
    uint256 regID = LibTraitRegistry.getByEntity(components, id, "HAND");
    return AffinityComponent(getAddrByID(components, AffinityCompID)).safeGet(regID);
  }

  /////////////////
  // QUERIES

  /// @notice get the entity ID of a kami from its index (tokenID)
  function getByIndex(IUintComp components, uint32 index) internal view returns (uint256) {
    uint256 id = genID(index);
    return LibEntityType.isShape(components, id, "KAMI") ? id : 0;
  }

  /// @notice retrieves the kami with the specified name
  function getByName(IUintComp components, string memory name) internal view returns (uint256) {
    uint256[] memory results = LibEntityType.queryWithValue(
      components,
      "KAMI",
      getCompByID(components, NameCompID),
      abi.encode(name)
    );
    return results.length > 0 ? results[0] : 0;
  }

  /////////////////
  // 721

  function stake(IUintComp components, uint256 id, uint256 accID) internal {
    StateComponent(getAddrByID(components, StateCompID)).set(id, string("RESTING"));
    IDOwnsKamiComponent(getAddrByID(components, IDOwnsKamiCompID)).set(id, accID);
  }

  function unstake(IUintComp components, uint256 id) internal {
    StateComponent(getAddrByID(components, StateCompID)).set(id, string("721_EXTERNAL"));
    IDOwnsKamiComponent(getAddrByID(components, IDOwnsKamiCompID)).set(id, 0);
  }

  /////////////////
  // LOGGING

  function logNameChange(IUintComp components, uint256 accID) public {
    LibData.inc(components, accID, 0, "KAMI_NAME", 1);
  }

  ////////////////////
  // UTILS

  function genID(uint32 kamiIndex) internal pure returns (uint256) {
    // todo: change to kami.index
    return uint256(keccak256(abi.encodePacked("kami.id", kamiIndex)));
  }

  function stateToIndex(string memory state) internal pure returns (uint32) {
    if (state.eq("RESTING")) return uint32(KamiState.RESTING);
    else if (state.eq("HARVESTING")) return uint32(KamiState.HARVESTING);
    else if (state.eq("DEAD")) return uint32(KamiState.DEAD);
    else if (state.eq("721_EXTERNAL")) return uint32(KamiState.EXTERNAL_721);
    else revert("LibKami: invalid state");
  }

  function indexToState(uint32 index) internal pure returns (string memory) {
    if (index == uint32(KamiState.RESTING)) return "RESTING";
    else if (index == uint32(KamiState.HARVESTING)) return "HARVESTING";
    else if (index == uint32(KamiState.DEAD)) return "DEAD";
    else if (index == uint32(KamiState.EXTERNAL_721)) return "721_EXTERNAL";
    else revert("LibKami: invalid state");
  }
}
