// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { Stat } from "solecs/components/types/Stat.sol";

import { DescriptionComponent, ID as DescriptionCompID } from "components/DescriptionComponent.sol";
import { ExperienceComponent, ID as ExpCompID } from "components/ExperienceComponent.sol";
import { IndexItemComponent, ID as IndexItemCompID } from "components/IndexItemComponent.sol";
import { IndexRoomComponent, ID as IndexRoomCompID } from "components/IndexRoomComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibFor } from "libraries/utils/LibFor.sol";
import { LibReference } from "libraries/utils/LibReference.sol";

import { LibAllo } from "libraries/LibAllo.sol";
import { Condition, LibConditional } from "libraries/LibConditional.sol";
import { LibData } from "libraries/LibData.sol";
import { LibDroptable } from "libraries/LibDroptable.sol";
import { LibERC20 } from "libraries/LibERC20.sol";
import { LibFlag } from "libraries/LibFlag.sol";
import { LibStat } from "libraries/LibStat.sol";
import { LibScore } from "libraries/LibScore.sol";

/** @notice
 * Items are shapes that can be held by inventories. They are fungible.
 *
 * Item info is stored via a registry shape:
 *  - EntityType: ITEM
 *  - IsRegistry
 *  - ItemIndex
 *  - Type
 *  - Name
 *  - Description
 *  - MediaURI
 *  - [Optional] TokenAddress
 *
 * Consumable items are a rough grouping of usable items (linked to a system).
 * they follow this pattern (although does not strictly need to):
 *  - Type: defines item behaviour. expected 1 system per type (deprecated - for FE)
 *  - For: for kamis/accounts/others
 *
 * Items have different behaviour depending on how they are used. e.g. Burning vs Consuming
 *  - Usecase: References are used to differenciate between usecases (e.g. USE, BURN)
 *  - RefID: hash(ACTION, regID)
 *  - item Requirements and Effects are linked to each use case via a Reference
 *
 * Notable item shapes (defined in _ItemRegistrySystem):
 *  - lootbox: type LOOTBOX, LibDroptable for weights and keys
 */
library LibItem {
  using SafeCastLib for int32;
  using LibString for string;
  using LibComp for IComponent;

  /////////////////
  // SHAPES

  /// @notice create a base Registry entry for an item.
  /** @dev
   * empty item, can be built on for item types or left like this
   * $MUSU is an item like this, intended index 1
   */
  function createItem(
    IUintComp components,
    uint32 index,
    string memory type_,
    string memory name,
    string memory description,
    string memory mediaURI
  ) internal returns (uint256 id) {
    id = genID(index);
    LibEntityType.set(components, id, "ITEM");
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).set(id);
    IndexItemComponent(getAddrByID(components, IndexItemCompID)).set(id, index);

    TypeComponent(getAddrByID(components, TypeCompID)).set(id, type_);
    NameComponent(getAddrByID(components, NameCompID)).set(id, name);
    DescriptionComponent(getAddrByID(components, DescriptionCompID)).set(id, description);
    MediaURIComponent(getAddrByID(components, MediaURICompID)).set(id, mediaURI);

    addFlag(components, index, type_); // additionally store type as flag, for reverse query
  }

  /** @notice
   * a Usecase is a grouping entity that collates item behavior for a given usecase (e.g. USE, BURN)
   *  Registry Entity <-> Usecase group <-> Item behavior (requirements, effects)
   */
  function createUseCase(
    IUintComp components,
    uint32 index,
    string memory useCase
  ) internal returns (uint256) {
    return LibReference.create(components, useCase, genRefAnchor(index));
  }

  /// @notice adds an optional token address to represent an ERC20 token
  function addERC20(IUintComp components, uint32 index, address tokenAddress) internal {
    LibERC20.setAddress(components, genID(index), tokenAddress);
  }

  function addRequirement(
    IWorld world,
    IUintComp components,
    uint32 index,
    string memory useCase,
    Condition memory data
  ) internal returns (uint256 id) {
    uint256 refID = createUseCase(components, index, useCase);
    id = LibConditional.createFor(world, components, data, genReqAnchor(refID));
  }

  function addFlag(IUintComp components, uint32 index, string memory flag) internal {
    LibFlag.setFull(components, genID(index), "ITEM", flag);
  }

  /// @notice delete a Registry entry for an item.
  function remove(IUintComp components, uint32 index) public {
    uint256 id = genID(index);
    LibEntityType.remove(components, id);
    IndexItemComponent(getAddrByID(components, IndexItemCompID)).remove(id);
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).remove(id);

    NameComponent(getAddrByID(components, NameCompID)).remove(id);
    DescriptionComponent(getAddrByID(components, DescriptionCompID)).remove(id);
    TypeComponent(getAddrByID(components, TypeCompID)).remove(id);
    MediaURIComponent(getAddrByID(components, MediaURICompID)).remove(id);

    LibStat.removeAll(components, id);
    ExperienceComponent(getAddrByID(components, ExpCompID)).remove(id);

    LibDroptable.remove(components, id);
    LibFor.remove(components, id);
    IndexRoomComponent(getAddrByID(components, IndexRoomCompID)).remove(id);
    LibERC20.remove(components, id);

    LibFlag.removeFull(components, LibFlag.queryFor(components, id));
    LibConditional.remove(components, getAllRequirements(components, index));
    LibAllo.remove(components, getAllAllos(components, index));
    LibReference.remove(components, getAllReferences(components, index));
  }

  /////////////////
  // INTERACTIONS

  function applyAllos(
    IWorld world,
    IUintComp components,
    uint32 index,
    string memory useCase,
    uint256 amt,
    uint256 targetID
  ) internal {
    uint256[] memory allos = getAlloFor(components, index, useCase);
    LibAllo.distribute(world, components, allos, amt, targetID);
  }

  /// @notice apply an item's stat to a target
  function applyStats(IUintComp components, uint32 itemIndex, uint256 targetID) internal {
    uint256 regID = genID(itemIndex);

    ExperienceComponent xpComp = ExperienceComponent(getAddrByID(components, ExpCompID));
    uint256 xp = xpComp.safeGet(regID);
    if (xp > 0) xpComp.inc(targetID, xp);

    LibStat.applyAll(components, regID, targetID);
  }

  function applyMove(IUintComp components, uint32 itemIndex, uint256 targetID) internal {
    uint256 regID = genID(itemIndex);
    IndexRoomComponent roomComp = IndexRoomComponent(getAddrByID(components, IndexRoomCompID));
    roomComp.set(targetID, roomComp.get(regID));
  }

  function droptableCommit(
    IWorld world,
    IUintComp components,
    uint32 itemIndex,
    uint256 amt,
    uint256 accID
  ) internal returns (uint256) {
    uint256 regID = genID(itemIndex);
    return LibDroptable.commit(world, components, regID, amt, accID);
  }

  /////////////////
  // CHECKERS

  /// @notice checks if item skips bonus action resets
  /// @dev bonus only resets upon USE
  function bypassBonusReset(IUintComp components, uint32 index) internal view returns (bool) {
    return LibFlag.has(components, genID(index), "BYPASS_BONUS_RESET");
  }

  /// @notice check if an item has a given state for a flag
  function checkFlag(
    IUintComp components,
    uint32 index,
    string memory flag,
    bool state
  ) internal view returns (bool) {
    return LibFlag.has(components, genID(index), flag) == state;
  }

  /// @notice check that All specified items have a given state for a flag
  function checkFlagAll(
    IUintComp components,
    uint32[] memory indices,
    string memory flag,
    bool state
  ) internal view returns (bool) {
    uint256[] memory ids = new uint256[](indices.length);
    for (uint256 i; i < indices.length; i++) ids[i] = genID(indices[i]);
    return LibFlag.checkAll(components, ids, flag, state);
  }

  /// @notice check that Any specified items have a given state for a flag
  function checkFlagAny(
    IUintComp components,
    uint32[] memory indices,
    string memory flag,
    bool state
  ) internal view returns (bool) {
    uint256[] memory ids = new uint256[](indices.length);
    for (uint256 i; i < indices.length; i++) ids[i] = genID(indices[i]);
    return LibFlag.checkAny(components, ids, flag, state);
  }

  /// @dev to prevent potential overflows, somehow
  function verifyMaxPerUse(IUintComp components, uint256 amt) public view {
    if (amt > 100) revert("max 100 item use at once");
  }

  /// @dev requirements looks at conditions outside of the item itself, e.g. kami/account
  function verifyRequirements(
    IUintComp components,
    uint32 index,
    string memory usecase,
    uint256 targetID
  ) public view {
    if (!LibConditional.check(components, getReqsFor(components, index, usecase), targetID))
      revert("Item: Reqs not met");
  }

  /// @notice check if entity is an item of specific type
  function verifyType(IUintComp components, uint32 index, string memory type_) public view {
    uint256 id = genID(index);
    if (!LibEntityType.isShape(components, id, "ITEM")) revert("thats not an item");
    if (!getCompByID(components, TypeCompID).eqString(id, type_))
      revert(LibString.concat("thats not item type ", type_));
  }

  function verifyType(
    IUintComp components,
    uint32[] memory indices,
    string memory type_
  ) public view returns (bool) {
    uint256[] memory ids = new uint256[](indices.length);
    for (uint256 i; i < indices.length; i++) ids[i] = genID(indices[i]);
    if (!LibEntityType.isShape(components, ids, "ITEM")) revert("thats not an item");
    if (!getCompByID(components, TypeCompID).eqString(ids, type_))
      revert(LibString.concat("thats not item type ", type_));
  }

  function verifyBurnable(IUintComp components, uint32[] memory indices) public view {
    uint256[] memory ids = new uint256[](indices.length);
    for (uint256 i; i < indices.length; i++) ids[i] = genID(indices[i]);
    if (!LibFlag.checkAll(components, ids, "ITEM_UNBURNABLE", false)) revert("item not burnable");
  }

  function verifyForShape(IUintComp components, uint32 index, string memory shape) public view {
    if (!LibFor.get(components, genID(index)).eq(shape))
      revert(LibString.concat("not for ", shape));
  }

  /////////////////
  // GETTERS

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexItemComponent(getAddrByID(components, IndexItemCompID)).get(id);
  }

  function getName(IUintComp components, uint32 index) internal view returns (string memory) {
    return NameComponent(getAddrByID(components, NameCompID)).get(genID(index));
  }

  function getTokenAddr(IUintComp components, uint32 index) internal view returns (address) {
    return LibERC20.getAddress(components, genID(index));
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    TypeComponent comp = TypeComponent(getAddrByID(components, TypeCompID));
    return comp.has(id) ? comp.get(id) : "";
  }

  function getAlloFor(
    IUintComp components,
    uint32 index,
    string memory useCase
  ) internal view returns (uint256[] memory) {
    uint256 refID = LibReference.genID(useCase, genRefAnchor(index));
    return LibAllo.queryFor(components, genAlloAnchor(refID));
  }

  function getReqsFor(
    IUintComp components,
    uint32 index,
    string memory useCase
  ) internal view returns (uint256[] memory) {
    uint256 refID = LibReference.genID(useCase, genRefAnchor(index));
    return LibConditional.queryFor(components, genReqAnchor(refID));
  }

  function getAllReferences(
    IUintComp components,
    uint32 index
  ) internal view returns (uint256[] memory) {
    return LibReference.queryByParent(components, genRefAnchor(index));
  }

  function getAllAllos(
    IUintComp components,
    uint32 index
  ) internal view returns (uint256[] memory) {
    uint256[] memory refs = getAllReferences(components, index);
    for (uint256 i; i < refs.length; i++) refs[i] = genAlloAnchor(refs[i]);
    return LibAllo.queryFor(components, refs);
  }

  function getAllRequirements(
    IUintComp components,
    uint32 index
  ) internal view returns (uint256[] memory) {
    uint256[] memory refs = getAllReferences(components, index);
    for (uint256 i; i < refs.length; i++) refs[i] = genReqAnchor(refs[i]);
    return LibConditional.queryFor(components, refs);
  }

  /////////////////
  // SETTERS

  function setFor(IUintComp components, uint256 id, string memory for_) internal {
    LibFor.set(components, id, for_);
  }

  function setRoom(IUintComp components, uint256 id, uint32 roomIndex) internal {
    IndexRoomComponent(getAddrByID(components, IndexRoomCompID)).set(id, roomIndex);
  }

  /////////////////
  // QUERIES

  /// @notice get the associated item registry entry of a given instance entity
  /// @dev assumes instanceID is a valid inventory instance
  function getByInstance(IUintComp components, uint256 instanceID) internal view returns (uint256) {
    IndexItemComponent comp = IndexItemComponent(getAddrByID(components, IndexItemCompID));
    uint32 index = comp.get(instanceID);
    uint256 id = genID(index);
    return comp.has(id) ? id : 0;
  }

  function getByIndex(IUintComp components, uint32 index) internal view returns (uint256) {
    IndexItemComponent comp = IndexItemComponent(getAddrByID(components, IndexItemCompID));
    uint256 id = genID(index);
    return comp.has(id) ? id : 0;
  }

  /////////////////
  // UTILS

  /// @notice Retrieve the ID of a registry entry
  function genID(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("registry.item", index)));
  }

  function genRefAnchor(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("item.usecase", index)));
  }

  function genAlloAnchor(uint256 refID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("item.allo", refID)));
  }

  function genReqAnchor(uint256 refID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("item.requirement", refID)));
  }

  /////////////////
  // DATA LOGGING

  function logUse(
    IUintComp components,
    uint256 accID,
    uint32 itemIndex,
    uint256 amt,
    string memory targetShape
  ) public {
    uint32[] memory indices = new uint32[](2);
    indices[0] = itemIndex;
    indices[1] = 0; // tracking an account's total item usage
    LibData.inc(components, accID, indices, "ITEM_USE", amt);
    // log ACCOUNT_ITEM_USE or KAMI_ITEM_USE
    LibData.inc(components, accID, 0, targetShape.concat("_ITEM_USE"), amt);
  }
}
