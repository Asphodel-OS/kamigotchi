// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { LibString } from "solady/utils/LibString.sol";

import { IdSourceComponent, ID as IdSourceCompID } from "components/IdSourceComponent.sol";
import { IDAnchorComponent, ID as IDAnchorCompID } from "components/IDAnchorComponent.sol";
import { IDTypeComponent, ID as IDTypeCompID } from "components/IDTypeComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";
import { TimeComponent, ID as TimeCompID } from "components/TimeComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { SubtypeComponent, ID as SubtypeCompID } from "components/SubtypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibArray } from "libraries/utils/LibArray.sol";
import { LibComp } from "libraries/utils/LibComp.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";

/**
 * @notice
 * Bonuses consists of a registry entry and local instance.
 *   - Ensures updatability via Registry pattern
 *   - Allows removal for specific/all bonuses of type, eg. when respecing skill
 * Temporary vs Permanent bonuses:
 *  - Permanent are attached to an Entity (skill instance, equip) via IDAnchor
 *  - Temporary are attached to a EndAnchor (UPON_HARVEST_ACTION, TIMED) via IDAnchor=hash("UPON_HARVEST_ACTION")
 *
 * Registry shape: ID = hash("bonus.registry", anchorID, type)
 * - IsRegistry
 * - EntityType: BONUS
 * - IDAnchor: Parent registry's ID (e.g. SkillRegistryID)
 * - Time [temporary only] - Duration of bonus, for timed bonuses only
 * - Type
 * - Subtype [temporary only] - EndAnchor (e.g. UPON_HARVEST_ACTION, TIMED)
 * - Value (used as Int256, but stored as uint256)
 *
 * Instance shape: ID = hash("bonus.instance", registryID, holderID, duration)
 * - IdSource: relevant BonusRegistryID
 * - IDAnchor: for querying perm bonuses (eg. skill instance), or temp bonuses (e.g. UPON_HARVEST_ACTION)
 * - IDType: type, used to query all bonuses of type [hash("bonus.type", type, holderID)]
 * - Level: bonus level, acts as a multiplier
 *
 *  QUERIES: To get a bonus value for a given entity (acc/pet),
 *   1. query all relevant bonus instances
 *   2. get values from registry, sum
 */
library LibBonus {
  using LibArray for uint256[];
  using LibComp for IUintComp;
  using LibComp for IComponent;
  using LibString for string;
  using SafeCastLib for uint256;
  using SafeCastLib for int256;

  /////////////////
  // SHAPES

  /// @notice creates a registry entry
  function regCreate(
    IUintComp components,
    uint256 anchorID,
    string memory type_,
    string memory endAnchor, // leave blank if permanent
    uint256 duration, // leave 0 if permanent or not time based
    int256 value // can be negative, no safecast
  ) internal returns (uint256 id) {
    id = genRegID(anchorID, type_);
    require(!LibEntityType.has(components, id), "Bonus: already exists"); // no duplicate type for parent
    LibEntityType.set(components, id, "BONUS");
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).set(id);

    IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).set(id, anchorID);
    TypeComponent(getAddrByID(components, TypeCompID)).set(id, type_);
    ValueComponent(getAddrByID(components, ValueCompID)).set(id, uint256(value));

    // adding if temporary
    if (!endAnchor.eq(""))
      SubtypeComponent(getAddrByID(components, SubtypeCompID)).set(id, endAnchor);
    if (duration > 0) TimeComponent(getAddrByID(components, TimeCompID)).set(id, duration);
  }

  function assign(
    IUintComp components,
    uint256 regID,
    uint256 anchorID,
    uint256 holderID
  ) internal returns (uint256 id) {
    // get duration (if any)
    TimeComponent timeComp = TimeComponent(getAddrByID(components, TimeCompID));
    uint256 duration = timeComp.safeGet(regID);
    if (duration == 0) {
      id = genInstanceID(regID, holderID, 0);
    } else {
      id = genInstanceID(regID, holderID, block.timestamp + duration);
      timeComp.set(id, block.timestamp + duration); // set end time for each timed instance
    }

    // setting base components
    IdSourceComponent sourceComp = IdSourceComponent(getAddrByID(components, IdSourceCompID));
    if (sourceComp.has(id)) return id; // skip if already created
    sourceComp.set(id, regID);
    setTypeIDFromReg(components, id, regID, holderID);

    // setting anchor (permanent or temporary)
    SubtypeComponent endTypeComp = SubtypeComponent(getAddrByID(components, SubtypeCompID));
    if (endTypeComp.has(regID)) {
      // temporary bonus (registry has endtype)
      uint256 endAnchor = genEndAnchor(endTypeComp.get(regID), holderID);
      IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).set(id, endAnchor);
    } else {
      // permanent bonus (anchor to entity)
      if (anchorID == 0) revert("Bonus: anchorID needed for perm bonus");
      IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).set(id, anchorID);
    }
  }

  function regRemoveByAnchor(IUintComp components, uint256[] memory anchorIDs) internal {
    uint256[] memory ids = queryByParent(components, anchorIDs);
    return regRemove(components, ids);
  }

  function regRemoveByAnchor(IUintComp components, uint256 anchorID) internal {
    uint256[] memory ids = queryByParent(components, anchorID);
    regRemove(components, ids);
  }

  /// @notice removes a registry entry
  function regRemove(IUintComp components, uint256[] memory ids) internal {
    LibEntityType.remove(components, ids);
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).remove(ids);
    IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).remove(ids);
    TimeComponent(getAddrByID(components, TimeCompID)).remove(ids);
    TypeComponent(getAddrByID(components, TypeCompID)).remove(ids);
    SubtypeComponent(getAddrByID(components, SubtypeCompID)).remove(ids);
    ValueComponent(getAddrByID(components, ValueCompID)).remove(ids);
  }

  /// @notice removes a bonus instance
  function unassign(IUintComp components, uint256 id) internal {
    IdSourceComponent(getAddrByID(components, IdSourceCompID)).remove(id);
    IDTypeComponent(getAddrByID(components, IDTypeCompID)).remove(id);
    IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).remove(id);
    LevelComponent(getAddrByID(components, LevelCompID)).remove(id);
    TimeComponent(getAddrByID(components, TimeCompID)).remove(id);
  }

  /// @notice remove bonus instances
  function unassign(IUintComp components, uint256[] memory ids) internal {
    IdSourceComponent(getAddrByID(components, IdSourceCompID)).remove(ids);
    IDTypeComponent(getAddrByID(components, IDTypeCompID)).remove(ids);
    IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).remove(ids);
    LevelComponent(getAddrByID(components, LevelCompID)).remove(ids);
    TimeComponent(getAddrByID(components, TimeCompID)).remove(ids);
  }

  /////////////////
  // INTERACTIONS

  /// @notice increases bonus based on registry entry (eg skill)
  function incBy(
    IUintComp components,
    uint256 regAnchorID,
    uint256 anchorID,
    uint256 holderID,
    uint256 amt
  ) internal returns (uint256[] memory instanceIDs) {
    uint256[] memory regIDs = queryByParent(components, regAnchorID);
    instanceIDs = new uint256[](regIDs.length);
    for (uint256 i; i < regIDs.length; i++) {
      instanceIDs[i] = assign(components, regIDs[i], anchorID, holderID);
    }
    LevelComponent(getAddrByID(components, LevelCompID)).inc(instanceIDs, amt);
  }

  /// @dev incBy, but only for temporary bonuses. implicitly checked by assign()
  function incByTemporary(
    IUintComp components,
    uint256 regAnchorID,
    uint256 holderID,
    uint256 amt
  ) internal returns (uint256[] memory instanceIDs) {
    return incBy(components, regAnchorID, 0, holderID, amt);
  }

  /// @notice unassigns non-timed bonuses with given anchor
  /// @dev meant for temporary, non-timed bonuses
  function unassignBy(IUintComp components, string memory endType, uint256 holderID) internal {
    uint256[] memory bonusIDs = queryByParent(components, genEndAnchor(endType, holderID));
    unassign(components, bonusIDs);
  }

  function unassignTimed(IUintComp components, uint256 holderID) internal {
    // unimplemented
    uint256[] memory bonusIDs = queryByParent(components, genEndAnchor("TIMED", holderID));
    // unassign(components, bonusIDs);
  }

  /////////////////
  // CALCS

  /// @notice accepts uint256 value and returns signed int256
  /// @param rawValue unsigned value. can be negative; do not safecast
  /// @param level multiplier for bonus. Not expected to go out of bounds of uint128
  function calcSingle(uint256 rawValue, uint256 level) internal pure returns (int256) {
    return int256(rawValue) * level.toInt256();
  }

  /////////////////
  // GETTERS

  function get(IUintComp components, uint256[] memory ids) internal view returns (int256 total) {
    uint256[] memory regs = IdSourceComponent(getAddrByID(components, IdSourceCompID)).safeGet(ids);
    uint256[] memory levels = LevelComponent(getAddrByID(components, LevelCompID)).safeGet(ids);
    uint256[] memory values = ValueComponent(getAddrByID(components, ValueCompID)).safeGet(regs);

    for (uint256 i; i < ids.length; i++) total += calcSingle(values[i], levels[i]);
  }

  function getFor(
    IUintComp components,
    string memory type_,
    uint256 holderID
  ) internal view returns (int256) {
    uint256[] memory ids = queryByType(components, type_, holderID);
    return get(components, ids);
  }

  function getForUint256(
    IUintComp components,
    string memory type_,
    uint256 holderID
  ) internal view returns (uint256) {
    int256 raw = getFor(components, type_, holderID);
    return raw > 0 ? uint256(raw) : 0;
  }

  /////////////////
  // SETTERS

  function setTypeIDFromReg(
    IUintComp components,
    uint256 id,
    uint256 regID,
    uint256 holderID
  ) internal {
    IDTypeComponent(getAddrByID(components, IDTypeCompID)).set(
      id,
      genTypeID(TypeComponent(getAddrByID(components, TypeCompID)).get(regID), holderID)
    );
  }

  /////////////////
  // QUERIES

  function queryByParent(
    IUintComp components,
    uint256 anchorID
  ) internal view returns (uint256[] memory) {
    return IUintComp(getAddrByID(components, IDAnchorCompID)).getEntitiesWithValue(anchorID);
  }

  function queryByParent(
    IUintComp components,
    uint256[] memory anchorIDs
  ) internal view returns (uint256[] memory) {
    return IUintComp(getAddrByID(components, IDAnchorCompID)).getEntitiesWithValue(anchorIDs);
  }

  function queryByType(
    IUintComp components,
    string memory type_,
    uint256 holderID
  ) internal view returns (uint256[] memory) {
    uint256 id = genTypeID(type_, holderID);
    return IUintComp(getAddrByID(components, IDTypeCompID)).getEntitiesWithValue(id);
  }

  //////////////
  // RESETTERS

  /// @notice resets upon harvest action (collect, feed, stop)
  function resetUponHarvestAction(IUintComp components, uint256 holderID) public {
    unassignBy(components, "UPON_HARVEST_ACTION", holderID);
  }

  //////////////
  // IDs

  function genRegID(uint256 anchorID, string memory type_) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("bonus.registry", anchorID, type_)));
  }

  function genInstanceID(
    uint256 regID,
    uint256 holderID,
    uint256 duration
  ) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("bonus.instance", regID, holderID, duration)));
  }

  function genTypeID(string memory type_, uint256 holderID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("bonus.type", type_, holderID)));
  }

  function genEndAnchor(string memory type_, uint256 holderID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("bonus.ending.type", type_, holderID)));
  }
}
