// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";

import { IdSourceComponent, ID as IdSourceCompID } from "components/IdSourceComponent.sol";
import { IDParentComponent, ID as IDParentCompID } from "components/IDParentComponent.sol";
import { IDTypeComponent, ID as IDTypeCompID } from "components/IDTypeComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibArray } from "libraries/utils/LibArray.sol";
import { LibComp } from "libraries/utils/LibComp.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";

/**
 * @notice
 * Bonuses consists of a registry entry and local instance.
 *   - Ensures updatability via Registry pattern
 *   - Allows removal for specific/all bonuses of type, eg. when respecing skill
 * To get a bonus value for a given entity (acc/pet),
 *   1. query all relevant bonus instances
 *   2. get values from registry, sum
 *
 * Registry shape: ID = hash("bonus.registry", parentID, type)
 * - IsRegistry
 * - EntityType: BONUS
 * - IDParent: Parent registry's ID (e.g. SkillRegistryID)
 * - Type (FE only)
 * - Value (used as Int256, but stored as uint256)
 *
 * Instance shape: ID = hash("bonus.instance", registryID, holderID)
 * - IdSource: relevant BonusRegistryID
 * - IDParent: (optional - but assume have) for querying child bonuses from a parent (eg. skill instance)
 * - IDType: type, used to query all bonuses of type [hash("bonus.type", type, holderID)]
 * - Level: bonus level, acts as a multiplier
 */
library LibBonus {
  using LibArray for uint256[];
  using LibComp for IUintComp;
  using LibComp for IComponent;
  using SafeCastLib for uint256;
  using SafeCastLib for int256;

  /////////////////
  // SHAPES

  /// @notice creates a registry entry
  function registryCreate(
    IUintComp components,
    uint256 parentID,
    string memory type_,
    int256 value // can be negative, no safecast
  ) internal returns (uint256 id) {
    id = genRegID(parentID, type_);
    require(!LibEntityType.has(components, id), "Bonus: already exists"); // no duplicate type for parent
    LibEntityType.set(components, id, "BONUS");
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).set(id);

    IDParentComponent(getAddrByID(components, IDParentCompID)).set(id, parentID);
    TypeComponent(getAddrByID(components, TypeCompID)).set(id, type_);
    ValueComponent(getAddrByID(components, ValueCompID)).set(id, uint256(value));
  }

  /// @notice assigns a bonus instance to an entity
  function assign(
    IUintComp components,
    uint256 regID,
    string memory type_,
    uint256 holderID
  ) internal returns (uint256 id) {
    id = genInstanceID(regID, holderID);
    IdSourceComponent(getAddrByID(components, IdSourceCompID)).set(id, regID);
    IDTypeComponent(getAddrByID(components, IDTypeCompID)).set(id, genTypeID(type_, holderID));
  }

  /// @notice assigns a bonus instance to an entity, with parent
  function assign(
    IUintComp components,
    uint256 regID,
    string memory type_,
    uint256 parentID,
    uint256 holderID
  ) internal returns (uint256 id) {
    id = assign(components, regID, type_, holderID);
    IDParentComponent(getAddrByID(components, IDParentCompID)).set(id, parentID);
  }

  /// @notice removes a registry entry
  function registryRemove(IUintComp components, uint256 id) internal {
    LibEntityType.remove(components, id);
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).remove(id);
    IDParentComponent(getAddrByID(components, IDParentCompID)).remove(id);
    TypeComponent(getAddrByID(components, TypeCompID)).remove(id);
    ValueComponent(getAddrByID(components, ValueCompID)).remove(id);
  }

  /// @notice removes a bonus instance
  function unassign(IUintComp components, uint256 id) internal {
    IdSourceComponent(getAddrByID(components, IdSourceCompID)).remove(id);
    IDTypeComponent(getAddrByID(components, IDTypeCompID)).remove(id);
    IDParentComponent(getAddrByID(components, IDParentCompID)).remove(id);
    LevelComponent(getAddrByID(components, LevelCompID)).remove(id);
  }

  /// @notice remove bonus instances
  function unassign(IUintComp components, uint256[] memory ids) internal {
    IdSourceComponent(getAddrByID(components, IdSourceCompID)).remove(ids);
    IDTypeComponent(getAddrByID(components, IDTypeCompID)).remove(ids);
    IDParentComponent(getAddrByID(components, IDParentCompID)).remove(ids);
    LevelComponent(getAddrByID(components, LevelCompID)).remove(ids);
  }

  /////////////////
  // INTERACTIONS

  /// @notice increases bonus based on registry entry (eg skill)
  function incBy(
    IUintComp components,
    uint256 parentRegID,
    uint256 holderID,
    uint256 amt
  ) internal returns (uint256[] memory) {
    uint256[] memory instanceIDs = _assignFromRegistry(components, parentRegID, holderID);
    LevelComponent(getAddrByID(components, LevelCompID)).inc(instanceIDs, amt);
    return instanceIDs;
  }

  /// @notice increases bonus based on registry entry (eg skill)
  function incBy(
    IUintComp components,
    uint256 parentRegID,
    uint256 parentID,
    uint256 holderID,
    uint256 amt
  ) internal returns (uint256[] memory) {
    uint256[] memory instanceIDs = _assignFromRegistry(components, parentRegID, parentID, holderID);
    LevelComponent(getAddrByID(components, LevelCompID)).inc(instanceIDs, amt);
    return instanceIDs;
  }

  /// @notice assigns bonus entity if not already assigned
  function _assignFromRegistry(
    IUintComp components,
    uint256 parentRegID,
    uint256 holderID
  ) internal returns (uint256[] memory) {
    IdSourceComponent idSourceComp = IdSourceComponent(getAddrByID(components, IdSourceCompID));
    IDTypeComponent idTypeComp = IDTypeComponent(getAddrByID(components, IDTypeCompID));
    TypeComponent typeComp = TypeComponent(getAddrByID(components, TypeCompID));

    uint256[] memory bonusRegIDs = queryByParent(components, parentRegID);
    uint256[] memory instanceIDs = new uint256[](bonusRegIDs.length);
    for (uint256 i; i < bonusRegIDs.length; i++) {
      uint256 id = genInstanceID(bonusRegIDs[i], holderID);
      instanceIDs[i] = id;
      if (!idTypeComp.has(id)) {
        idSourceComp.set(id, bonusRegIDs[i]);
        idTypeComp.set(id, genTypeID(typeComp.get(bonusRegIDs[i]), holderID));
      }
    }
    return instanceIDs;
  }

  function _assignFromRegistry(
    IUintComp components,
    uint256 parentRegID,
    uint256 parentID,
    uint256 holderID
  ) internal returns (uint256[] memory) {
    IdSourceComponent idSourceComp = IdSourceComponent(getAddrByID(components, IdSourceCompID));
    IDTypeComponent idTypeComp = IDTypeComponent(getAddrByID(components, IDTypeCompID));
    IDParentComponent idParentComp = IDParentComponent(getAddrByID(components, IDParentCompID));
    TypeComponent typeComp = TypeComponent(getAddrByID(components, TypeCompID));

    uint256[] memory bonusRegIDs = queryByParent(components, parentRegID);
    uint256[] memory instanceIDs = new uint256[](bonusRegIDs.length);
    for (uint256 i; i < bonusRegIDs.length; i++) {
      uint256 id = genInstanceID(bonusRegIDs[i], holderID);
      instanceIDs[i] = id;
      if (!idTypeComp.has(id)) {
        idSourceComp.set(id, bonusRegIDs[i]);
        idTypeComp.set(id, genTypeID(typeComp.get(bonusRegIDs[i]), holderID));
        idParentComp.set(id, parentID);
      }
    }
    return instanceIDs;
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
    uint256[] memory sources = IdSourceComponent(getAddrByID(components, IdSourceCompID)).safeGet(
      ids
    );
    uint256[] memory levels = LevelComponent(getAddrByID(components, LevelCompID)).safeGet(ids);
    uint256[] memory values = ValueComponent(getAddrByID(components, ValueCompID)).safeGet(sources);

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
  // QUERIES

  function queryByParent(
    IUintComp components,
    uint256 parentID
  ) internal view returns (uint256[] memory) {
    return IUintComp(getAddrByID(components, IDParentCompID)).getEntitiesWithValue(parentID);
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
  // IDs

  function genRegID(uint256 parentID, string memory type_) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("bonus.registry", parentID, type_)));
  }

  function genInstanceID(uint256 regID, uint256 holderID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("bonus.instance", regID, holderID)));
  }

  function genTypeID(string memory type_, uint256 holderID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("bonus.type", type_, holderID)));
  }
}
