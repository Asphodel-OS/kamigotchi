// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { LibComp } from "libraries/utils/LibComp.sol";

import { HasFlagComponent, ID as HasFlagCompID } from "components/HasFlagComponent.sol";
import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

/** @notice
 * LibFlag handles Flags - meta-entities that indicate their parent Has a specific Flag.
 * Usecases:
 *   - Community management roles (ie. commManager, moderator, etc.)
 *   - Flags for entities (ie. Passport Holder flag for an Account)
 *
 * Entity Shape:
 *   - ID: hash(parentID, flagType)
 *   - HasFlag: bool
 *   - [optional] IdHolder: ID (for FE reverse mapping)
 *   - [optional] Type: string (for FE reverse mapping)
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

  /// @notice sets a flag that can be reversed mapped on FE
  /// @dev not needed for most flags - only those that are to be listed on FE
  function setFull(
    IUintComp components,
    uint256 parentID,
    string memory flagType
  ) internal returns (uint256 id) {
    id = genID(parentID, flagType);
    _set(components, id, true);
    getCompByID(components, IdHolderCompID).checkAndSet(id, parentID);
    getCompByID(components, TypeCompID).checkAndSet(id, flagType);
  }

  /// @notice sets a flag, with ID already generated
  function _set(IUintComp components, uint256 id, bool state) internal {
    if (state) HasFlagComponent(getAddrByID(components, HasFlagCompID)).set(id);
    else remove(components, id);
  }

  /// @notice removes a flag. does not remove IdHolder or Type (if any)
  function remove(IUintComp components, uint256 id) internal {
    HasFlagComponent(getAddrByID(components, HasFlagCompID)).remove(id);
  }

  /// @notice deletes a full flag
  function removeFull(IUintComp components, uint256 parentID, string memory flag) internal {
    uint256 id = genID(parentID, flag);
    HasFlagComponent(getAddrByID(components, HasFlagCompID)).remove(id);
    getCompByID(components, IdHolderCompID).remove(id);
    getCompByID(components, TypeCompID).remove(id);
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

    HasFlagComponent flagComp = HasFlagComponent(getAddrByID(components, HasFlagCompID));
    prev = flagComp.has(id);
    state ? flagComp.set(id) : flagComp.remove(id);
  }

  //////////////////
  // GETTERS

  function has(
    IUintComp components,
    uint256 parentID,
    string memory flagType
  ) internal view returns (bool) {
    uint256 id = genID(parentID, flagType);
    return HasFlagComponent(getAddrByID(components, HasFlagCompID)).has(id);
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
    return getCompByID(components, HasFlagCompID).allHave(ids, state);
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
    return getCompByID(components, HasFlagCompID).allHave(ids, state);
  }

  //////////////////
  // UTILS

  function genID(uint256 id, string memory flagType) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("has.flag", id, flagType)));
  }
}
