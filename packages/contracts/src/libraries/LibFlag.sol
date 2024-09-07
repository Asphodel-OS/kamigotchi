// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { LibComp } from "libraries/utils/LibComp.sol";

import { HasFlagComponent, ID as HasFlagCompID } from "components/HasFlagComponent.sol";
import { IDPointerComponent, ID as IDPointerCompID } from "components/IDPointerComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { SubtypeComponent, ID as SubtypeCompID } from "components/SubtypeComponent.sol";

/** @notice
 * LibFlag handles Flags - meta-entities that indicate their parent Has a specific Flag.
 * Usecases:
 *   - Community management roles (ie. commManager, moderator, etc.)
 *   - Flags for entities (ie. Passport Holder flag for an Account)
 *
 * Entity Shape:
 *   - ID: hash(parentID, flagType)
 *   - HasFlag: bool
 *   - [optional] IdHolder: ID (for reverse mapping)
 *   - [optional] Type: string (for FE reverse mapping)
 *   - [optional] Subtype: string (for additional context)
 */
library LibFlag {
  using LibComp for IComponent;

  //////////////////
  // SHAPES

  /// @notice sets a bare flag
  /// @dev should be needed for most flags
  function set(
    IUintComp components,
    uint256 parentID,
    string memory flagType,
    bool state
  ) internal returns (uint256 id) {
    id = genID(parentID, flagType);
    _set(components, id, state);
  }

  /// @notice sets a reverse queriable flag
  function setFull(
    IUintComp components,
    uint256 parentID,
    string memory flagType
  ) internal returns (uint256 id) {
    id = genID(parentID, flagType);
    _set(components, id, true);
    getComponentById(components, IDPointerCompID).setIfEmpty(id, parentID);
    getComponentById(components, TypeCompID).setIfEmpty(id, flagType);
  }

  function addSubtype(IUintComp components, uint256 id, string memory subtype) internal {
    SubtypeComponent(getAddressById(components, SubtypeCompID)).set(id, subtype);
  }

  /// @notice sets a flag, with ID already generated
  function _set(IUintComp components, uint256 id, bool state) internal {
    if (state) HasFlagComponent(getAddressById(components, HasFlagCompID)).set(id);
    else remove(components, id);
  }

  /// @notice removes a flag. does not remove IdHolder or Type (if any)
  function remove(IUintComp components, uint256 id) internal {
    HasFlagComponent(getAddressById(components, HasFlagCompID)).remove(id);
  }

  /// @notice deletes a full flag
  function removeFull(IUintComp components, uint256 parentID, string memory flag) internal {
    uint256 id = genID(parentID, flag);
    HasFlagComponent(getAddressById(components, HasFlagCompID)).remove(id);
    getComponentById(components, IDPointerCompID).remove(id);
    getComponentById(components, TypeCompID).remove(id);
    getComponentById(components, SubtypeCompID).remove(id);
  }

  //////////////////
  // INTERACTIONS

  /// @notice gets a flag, then sets to desired state
  function getAndSet(
    IUintComp components,
    uint256 parentID,
    string memory flagType,
    bool state
  ) internal returns (bool prev) {
    uint256 id = genID(parentID, flagType);

    HasFlagComponent flagComp = HasFlagComponent(getAddressById(components, HasFlagCompID));
    prev = flagComp.has(id);
    state ? flagComp.set(id) : flagComp.remove(id);
  }

  //////////////////
  // GETTERS

  /// @notice gets all flags on entity in string form
  /// @dev only works for full flags
  function getAll(IUintComp components, uint256 parentID) internal view returns (string[] memory) {
    uint256[] memory ids = getAllIDs(components, parentID);
    return TypeComponent(getAddressById(components, TypeCompID)).getBatch(ids);
  }

  /// @notice gets all flags on entity in string form
  /// @dev only works for full flags; gets with addition subtype context
  function getAll(
    IUintComp components,
    uint256 parentID,
    string memory subtype
  ) internal view returns (string[] memory) {
    uint256[] memory ids = getAllIDs(components, parentID, subtype);
    return TypeComponent(getAddressById(components, TypeCompID)).getBatch(ids);
  }

  /// @notice get all flagIDs for a given parentID
  /// @dev only works for full flags
  function getAllIDs(
    IUintComp components,
    uint256 parentID
  ) internal view returns (uint256[] memory) {
    IDPointerComponent idComp = IDPointerComponent(getAddressById(components, IDPointerCompID));
    return idComp.getEntitiesWithValue(parentID);
  }

  /// @notice get all flagIDs for a given parentID and subtype
  /// @dev only works for full flags; gets with addition subtype context
  function getAllIDs(
    IUintComp components,
    uint256 parentID,
    string memory subtype
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IDPointerCompID),
      abi.encode(parentID)
    );
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, SubtypeCompID),
      abi.encode(subtype)
    );
    return LibQuery.query(fragments);
  }

  /////////////////
  // CHECKERS

  function has(
    IUintComp components,
    uint256 parentID,
    string memory flagType
  ) internal view returns (bool) {
    uint256 id = genID(parentID, flagType);
    return HasFlagComponent(getAddressById(components, HasFlagCompID)).has(id);
  }

  /// @notice checks if all entities have/doesn't have a flag
  /// @param state if true, checks if all entites have flag. opposite if false
  function checkAll(
    IUintComp components,
    uint256[] memory parentIDs,
    string memory flagType,
    bool state
  ) internal view returns (bool) {
    uint256[] memory ids = new uint256[](parentIDs.length);
    for (uint256 i; i < parentIDs.length; i++) ids[i] = genID(parentIDs[i], flagType);
    return getComponentById(components, HasFlagCompID).allHave(ids, state);
  }

  /// @notice checks if all entities have/doesn't have a flag
  /// @param state if true, checks if all entites have flag. opposite if false
  function checkAll(
    IUintComp components,
    uint256[] memory parentIDs,
    string[] memory flagTypes,
    bool state
  ) internal view returns (bool) {
    uint256[] memory ids = new uint256[](parentIDs.length);
    for (uint256 i; i < parentIDs.length; i++) ids[i] = genID(parentIDs[i], flagTypes[i]);
    return getComponentById(components, HasFlagCompID).allHave(ids, state);
  }

  //////////////////
  // UTILS

  function genID(uint256 id, string memory flagType) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("has.flag", id, flagType)));
  }
}
