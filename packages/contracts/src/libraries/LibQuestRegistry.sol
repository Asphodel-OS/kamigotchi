// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { DescriptionAltComponent, ID as DescAltCompID } from "components/DescriptionAltComponent.sol";
import { DescriptionComponent, ID as DescCompID } from "components/DescriptionComponent.sol";
import { IndexQuestComponent, ID as IndexQuestCompID } from "components/IndexQuestComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { IsRepeatableComponent, ID as IsRepeatableCompID } from "components/IsRepeatableComponent.sol";
import { IsQuestComponent, ID as IsQuestCompID } from "components/IsQuestComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TimeComponent, ID as TimeCompID } from "components/TimeComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibArray } from "libraries/utils/LibArray.sol";
import { LibAssigner } from "libraries/LibAssigner.sol";
import { Condition, LibConditional } from "libraries/LibConditional.sol";
import { LibHash } from "libraries/utils/LibHash.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibReward } from "libraries/LibReward.sol";

// A registry for Quest related entities
// Quest is copied to an Account, the rest are referenced

library LibQuestRegistry {
  /////////////////
  // INTERACTIONS

  // Create a registry entry for a Quest
  // requires that all requirements, objectives and rewards are already registered
  function createQuest(
    IUintComp components,
    uint32 index,
    string memory name,
    string memory description,
    string memory endText
  ) internal returns (uint256 id) {
    id = genQuestID(index);
    IsQuestComponent isQuestComp = IsQuestComponent(getAddrByID(components, IsQuestCompID));
    require(!isQuestComp.has(id), "LibRegQ.createQ: index used");

    isQuestComp.set(id); // TODO: change to EntityType
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).set(id);
    IndexQuestComponent(getAddrByID(components, IndexQuestCompID)).set(id, index);
    NameComponent(getAddrByID(components, NameCompID)).set(id, name);
    DescriptionComponent(getAddrByID(components, DescCompID)).set(id, description);
    DescriptionAltComponent(getAddrByID(components, DescAltCompID)).set(id, endText);
  }

  function setRepeatable(IUintComp components, uint256 regID, uint256 duration) internal {
    IsRepeatableComponent(getAddrByID(components, IsRepeatableCompID)).set(regID);
    TimeComponent(getAddrByID(components, TimeCompID)).set(regID, duration);
  }

  function createObjective(
    IWorld world,
    IUintComp components,
    uint32 questIndex,
    string memory name, // this is a crutch to help FE
    Condition memory data
  ) internal returns (uint256 id) {
    id = LibConditional.createFor(world, components, data, genObjPtr(questIndex));
    NameComponent(getAddrByID(components, NameCompID)).set(id, name);

    // reversable hash for easy objective lookup
    LibHash.set(components, id, abi.encode("Quest.Objective", data.logic, data.type_, data.index));
  }

  function createRequirement(
    IWorld world,
    IUintComp components,
    uint32 questIndex,
    Condition memory data
  ) internal returns (uint256 id) {
    id = LibConditional.createFor(world, components, data, genReqPtr(questIndex));
  }

  /// @notice creates a basic reward entity
  function createReward(
    IWorld world,
    IUintComp components,
    uint32 questIndex,
    string memory type_,
    uint32 index,
    uint32[] memory keys,
    uint256[] memory weights,
    uint256 value
  ) internal returns (uint256 id) {
    id = LibReward.create(
      world,
      components,
      genRwdPtr(questIndex),
      type_,
      index,
      keys,
      weights,
      value
    );
  }

  function addAssigner(
    IUintComp components,
    uint256 questID,
    uint32 questIndex,
    uint256 assignerID
  ) internal returns (uint256 id) {
    id = LibAssigner.create(components, assignerID, questID);
    LibAssigner.addIndex(
      IndexQuestComponent(getAddrByID(components, IndexQuestCompID)),
      questIndex,
      id
    );
  }

  function removeQuest(IUintComp components, uint256 questID, uint32 questIndex) internal {
    IndexQuestComponent indexQuestComp = IndexQuestComponent(
      getAddrByID(components, IndexQuestCompID)
    );
    indexQuestComp.remove(questID);
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).remove(questID);
    IsQuestComponent(getAddrByID(components, IsQuestCompID)).remove(questID);
    NameComponent(getAddrByID(components, NameCompID)).remove(questID);
    DescriptionComponent(getAddrByID(components, DescCompID)).remove(questID);
    DescriptionAltComponent(getAddrByID(components, DescAltCompID)).remove(questID);

    IsRepeatableComponent(getAddrByID(components, IsRepeatableCompID)).remove(questID);
    TimeComponent(getAddrByID(components, TimeCompID)).remove(questID);

    uint256[] memory objs = getObjsByQuestIndex(components, questIndex);
    for (uint256 i; i < objs.length; i++) removeObjective(components, objs[i]);

    uint256[] memory reqs = getReqsByQuestIndex(components, questIndex);
    for (uint256 i; i < reqs.length; i++) LibConditional.remove(components, reqs[i]);

    uint256[] memory rwds = getRwdsByQuestIndex(components, questIndex);
    for (uint256 i; i < rwds.length; i++) LibReward.remove(components, rwds[i]);

    uint256[] memory assigners = LibAssigner.getAll(components, questID);
    for (uint256 i; i < assigners.length; i++)
      LibAssigner.remove(components, indexQuestComp, assigners[i]);
  }

  function removeObjective(IUintComp components, uint256 objectiveID) internal {
    LibConditional.remove(components, objectiveID);
    NameComponent(getAddrByID(components, NameCompID)).remove(objectiveID);
    LibHash.remove(components, objectiveID);
  }

  /////////////////
  // SETTERS

  function setIsRepeatable(IUintComp components, uint256 id) internal {
    IsRepeatableComponent(getAddrByID(components, IsRepeatableCompID)).set(id);
  }

  /////////////////
  // QUERIES

  // get registry entry by Quest index
  function getByIndex(IUintComp components, uint32 index) internal view returns (uint256 result) {
    result = genQuestID(index);
    return IsQuestComponent(getAddrByID(components, IsQuestCompID)).has(result) ? result : 0;
  }

  // get Objectives by Quest index
  function getObjsByQuestIndex(
    IUintComp components,
    uint32 index
  ) internal view returns (uint256[] memory) {
    return LibConditional.queryFor(components, genObjPtr(index));
  }

  // get requirements by Quest index
  function getReqsByQuestIndex(
    IUintComp components,
    uint32 index
  ) internal view returns (uint256[] memory) {
    return LibConditional.queryFor(components, genReqPtr(index));
  }

  // get reward by Quest index
  function getRwdsByQuestIndex(
    IUintComp components,
    uint32 index
  ) internal view returns (uint256[] memory) {
    return LibReward.queryFor(components, genRwdPtr(index));
  }

  /////////////////
  // UTILS

  /// @notice Retrieve the ID of a registry entry
  function genQuestID(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("registry.quest", index)));
  }

  /// @notice Retrieve the ID of a requirement array
  function genReqPtr(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("registry.quest.requirement", index)));
  }

  /// @notice Retrieve the ID of a reward array
  function genRwdPtr(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("registry.quest.reward", index)));
  }

  /// @notice Retrieve the ID of a objective array
  function genObjPtr(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("registry.quest.objective", index)));
  }
}
