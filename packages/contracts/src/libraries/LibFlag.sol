// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { LibComp } from "libraries/utils/LibComp.sol";

import { HasFlagComponent, ID as HasFlagCompID } from "components/HasFlagComponent.sol";
import { IDOwnsFlagComponent, ID as IDOwnsFlagCompID } from "components/IDOwnsFlagComponent.sol";
import { IDTypeComponent, ID as IDTypeCompID } from "components/IDTypeComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

/** @notice
 * LibFlag handles Flags - meta-entities that indicate their parent Has a specific Flag.
 * Usecases:
 *   - Community management roles (ie. commManager, moderator, etc.)
 *   - Flags for entities (ie. Passport Holder flag for an Account)
 *
 * Entity Shape:
 *   - ID: hash(anchorID, flagType)
 *   - HasFlag: bool
 *   - [optional] IDAnchor: ID (for reverse mapping)
 *   - [optional] IDType: ID of parent shape, eg ITEM_BURNABLE (for reverse mapping)
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
    uint256 holderID,
    string memory flagType,
    bool state
  ) internal returns (uint256 id) {
    id = genID(holderID, flagType);
    _set(components, id, state);
  }

  /// @notice sets a flag that can be reversed mapped
  /// @dev meant for registry flags
  function setFull(
    IUintComp components,
    uint256 holderID,
    string memory parentType,
    string memory flagType
  ) internal returns (uint256 id) {
    id = genID(holderID, flagType);
    _set(components, id, true);
    IDOwnsFlagComponent(getAddrByID(components, IDOwnsFlagCompID)).set(id, holderID);
    IDTypeComponent(getAddrByID(components, IDTypeCompID)).set(
      id,
      genTypeAnchor(parentType, flagType)
    );
    TypeComponent(getAddrByID(components, TypeCompID)).set(id, flagType);
  }

  /// @notice sets a flag, with ID already generated
  function _set(IUintComp components, uint256 id, bool state) internal {
    if (state) HasFlagComponent(getAddrByID(components, HasFlagCompID)).set(id);
    else remove(components, id);
  }

  /// @notice removes a flag. does not remove IDAnchor or Type (if any)
  function remove(IUintComp components, uint256 id) internal {
    HasFlagComponent(getAddrByID(components, HasFlagCompID)).remove(id);
  }

  function remove(IUintComp components, uint256[] memory ids) internal {
    HasFlagComponent(getAddrByID(components, HasFlagCompID)).remove(ids);
  }

  function remove(IUintComp components, uint256 holderID, string memory flagType) internal {
    remove(components, genID(holderID, flagType));
  }

  /// @notice deletes a full flag
  function removeFull(IUintComp components, uint256 anchorID, string memory flag) internal {
    uint256 id = genID(anchorID, flag);
    HasFlagComponent(getAddrByID(components, HasFlagCompID)).remove(id);
    getCompByID(components, IDOwnsFlagCompID).remove(id);
    getCompByID(components, IDTypeCompID).remove(id);
    getCompByID(components, TypeCompID).remove(id);
  }

  function removeFull(IUintComp components, uint256[] memory ids) internal {
    HasFlagComponent(getAddrByID(components, HasFlagCompID)).remove(ids);
    IDOwnsFlagComponent(getAddrByID(components, IDOwnsFlagCompID)).remove(ids);
    IDTypeComponent(getAddrByID(components, IDTypeCompID)).remove(ids);
    TypeComponent(getAddrByID(components, TypeCompID)).remove(ids);
  }

  //////////////////
  // INTERACTIONS

  /// @notice gets a flag, then sets to desired state
  function getAndSet(
    IUintComp components,
    uint256 anchorID,
    string memory flagType,
    bool state
  ) internal returns (bool prev) {
    uint256 id = genID(anchorID, flagType);

    HasFlagComponent flagComp = HasFlagComponent(getAddrByID(components, HasFlagCompID));
    prev = flagComp.has(id);
    state ? flagComp.set(id) : flagComp.remove(id);
  }

  //////////////////
  // GETTERS

  function has(
    IUintComp components,
    uint256 anchorID,
    string memory flagType
  ) internal view returns (bool) {
    uint256 id = genID(anchorID, flagType);
    return HasFlagComponent(getAddrByID(components, HasFlagCompID)).has(id);
  }

  /// @notice checks if All entities [have|not have] a flag
  /// @param anchorIDs entities to check for flags on
  /// @param flag flag to check for
  /// @param state toggle
  /// @dev if state=true, return true if all entities have flag
  /// @dev if state=false, return true if all entities do not have the flag
  function checkAll(
    IUintComp components,
    uint256[] memory anchorIDs,
    string memory flag,
    bool state
  ) internal view returns (bool) {
    uint256[] memory ids = new uint256[](anchorIDs.length);
    for (uint256 i; i < ids.length; i++) ids[i] = genID(anchorIDs[i], flag);
    return getCompByID(components, HasFlagCompID).allHave(ids, state);
  }

  /// @notice checks if Any entity [has|not has] a flag
  /// @param anchorIDs entities to check for flags on
  /// @param flag flag to check for
  /// @param state toggle
  /// @dev if state=true, return true if any entity has flag
  /// @dev if state=false, return true if any entities do not have the flag
  function checkAny(
    IUintComp components,
    uint256[] memory anchorIDs,
    string memory flag,
    bool state
  ) internal view returns (bool) {
    uint256[] memory ids = new uint256[](anchorIDs.length);
    for (uint256 i; i < ids.length; i++) ids[i] = genID(anchorIDs[i], flag);
    return getCompByID(components, HasFlagCompID).anyHave(ids, state);
  }

  //////////////////
  // QUERIES

  function queryFor(
    IUintComp components,
    uint256 anchorID
  ) internal view returns (uint256[] memory) {
    return
      IDOwnsFlagComponent(getAddrByID(components, IDOwnsFlagCompID)).getEntitiesWithValue(anchorID);
  }

  //////////////////
  // UTILS

  function genID(uint256 id, string memory flagType) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("has.flag", id, flagType)));
  }

  function genTypeAnchor(
    string memory parentType,
    string memory flagType
  ) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("flag.type", parentType, flagType)));
  }
}
