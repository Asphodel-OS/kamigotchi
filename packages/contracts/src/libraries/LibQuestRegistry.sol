// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { DescriptionAltComponent, ID as DescAltCompID } from "components/DescriptionAltComponent.sol";
import { DescriptionComponent, ID as DescCompID } from "components/DescriptionComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IndexQuestComponent, ID as IndexQuestCompID } from "components/IndexQuestComponent.sol";
import { IdOwnsConditionComponent, ID as IdOwnsCondCompID } from "components/IdOwnsConditionComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { IsObjectiveComponent, ID as IsObjectiveCompID } from "components/IsObjectiveComponent.sol";
import { IsRepeatableComponent, ID as IsRepeatableCompID } from "components/IsRepeatableComponent.sol";
import { IsRequirementComponent, ID as IsRequirementCompID } from "components/IsRequirementComponent.sol";
import { IsRewardComponent, ID as IsRewardCompID } from "components/IsRewardComponent.sol";
import { IsQuestComponent, ID as IsQuestCompID } from "components/IsQuestComponent.sol";
import { HashComponent, ID as HashCompID } from "components/HashComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TimeComponent, ID as TimeCompID } from "components/TimeComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";

import { LibArray } from "libraries/utils/LibArray.sol";
import { LibHash } from "libraries/utils/LibHash.sol";
import { LibCoin } from "libraries/LibCoin.sol";
import { LibInventory } from "libraries/LibInventory.sol";

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
  ) internal returns (uint256) {
    uint256 id = genQuestID(index);
    IsQuestComponent isQuestComp = IsQuestComponent(getAddressById(components, IsQuestCompID));
    require(!isQuestComp.has(id), "LibRegQ.createQ: index used");

    isQuestComp.set(id);
    setIsRegistry(components, id);
    setQuestIndex(components, id, index);
    setName(components, id, name);
    DescriptionComponent(getAddressById(components, DescCompID)).set(id, description);
    DescriptionAltComponent(getAddressById(components, DescAltCompID)).set(id, endText);

    return id;
  }

  function setRepeatable(IUintComp components, uint256 regID, uint256 duration) internal {
    setIsRepeatable(components, regID);
    setTime(components, regID, duration);
  }

  function createEmptyObjective(
    IWorld world,
    IUintComp components,
    uint32 questIndex,
    string memory name, // this is a crutch to help FE, ideally we drop this
    string memory logicType,
    string memory type_,
    uint32 objIndex // objs must have an index - it can be 0
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setConditionOwner(components, id, genObjPtr(questIndex));

    setQuestIndex(components, id, questIndex);
    setIsRegistry(components, id);
    setIsObjective(components, id);
    setName(components, id, name);
    setLogicType(components, id, logicType);
    setType(components, id, type_);
    setIndex(components, id, objIndex);

    // reversable hash for easy objective lookup
    LibHash.set(components, id, abi.encode("Quest.Objective", logicType, type_, objIndex));

    return id;
  }

  function createEmptyRequirement(
    IWorld world,
    IUintComp components,
    uint32 questIndex,
    string memory logicType,
    string memory type_
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setConditionOwner(components, id, genReqPtr(questIndex));

    setIsRegistry(components, id);
    setIsRequirement(components, id);
    setQuestIndex(components, id, questIndex);
    setLogicType(components, id, logicType);
    setType(components, id, type_);

    return id;
  }

  function createEmptyReward(
    IWorld world,
    IUintComp components,
    uint32 questIndex,
    string memory type_
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setConditionOwner(components, id, genRwdPtr(questIndex));

    setIsRegistry(components, id);
    setIsReward(components, id);
    setQuestIndex(components, id, questIndex);
    setType(components, id, type_);

    return id;
  }

  function deleteQuest(IUintComp components, uint256 questID, uint32 questIndex) internal {
    unsetIsRegistry(components, questID);
    unsetIsQuest(components, questID);
    unsetQuestIndex(components, questID);
    unsetName(components, questID);
    DescriptionComponent(getAddressById(components, DescCompID)).remove(questID);
    DescriptionAltComponent(getAddressById(components, DescAltCompID)).remove(questID);

    unsetIsRepeatable(components, questID);
    unsetTime(components, questID);
  }

  function deleteObjective(IUintComp components, uint256 objectiveID) internal {
    unsetConditionOwner(components, objectiveID);
    unsetIsRegistry(components, objectiveID);
    unsetIsObjective(components, objectiveID);
    unsetQuestIndex(components, objectiveID);
    unsetName(components, objectiveID);
    unsetLogicType(components, objectiveID);
    unsetType(components, objectiveID);
    unsetIndex(components, objectiveID);
    unsetBalance(components, objectiveID);

    LibHash.remove(components, objectiveID);
  }

  function deleteRequirement(IUintComp components, uint256 requirementID) internal {
    unsetConditionOwner(components, requirementID);
    unsetIsRegistry(components, requirementID);
    unsetIsRequirement(components, requirementID);
    unsetQuestIndex(components, requirementID);
    unsetLogicType(components, requirementID);
    unsetType(components, requirementID);
    unsetIndex(components, requirementID);
    unsetBalance(components, requirementID);
  }

  function deleteReward(IUintComp components, uint256 rewardID) internal {
    unsetConditionOwner(components, rewardID);
    unsetIsRegistry(components, rewardID);
    unsetIsReward(components, rewardID);
    unsetQuestIndex(components, rewardID);
    unsetType(components, rewardID);
    unsetIndex(components, rewardID);
    unsetBalance(components, rewardID);
  }

  /////////////////
  // CHECKERS

  function hasType(IUintComp components, uint256 id) internal view returns (bool) {
    return TypeComponent(getAddressById(components, TypeCompID)).has(id);
  }

  function isType(
    IUintComp components,
    uint256 id,
    string memory _type
  ) internal view returns (bool) {
    return TypeComponent(getAddressById(components, TypeCompID)).hasValue(id, _type);
  }

  function isLogicType(
    IUintComp components,
    uint256 id,
    string memory _type
  ) internal view returns (bool) {
    return LogicTypeComponent(getAddressById(components, LogicTypeCompID)).hasValue(id, _type);
  }

  function isRepeatable(IUintComp components, uint256 id) internal view returns (bool) {
    return IsRepeatableComponent(getAddressById(components, IsRepeatableCompID)).has(id);
  }

  /////////////////
  // SETTERS

  function setBalance(IUintComp components, uint256 id, uint256 value) internal {
    BalanceComponent(getAddressById(components, BalanceCompID)).set(id, value);
  }

  function setConditionOwner(IUintComp components, uint256 id, uint256 ownerID) internal {
    IdOwnsConditionComponent(getAddressById(components, IdOwnsCondCompID)).set(id, ownerID);
  }

  function setIsRegistry(IUintComp components, uint256 id) internal {
    IsRegistryComponent(getAddressById(components, IsRegCompID)).set(id);
  }

  function setIsRepeatable(IUintComp components, uint256 id) internal {
    IsRepeatableComponent(getAddressById(components, IsRepeatableCompID)).set(id);
  }

  function setIsQuest(IUintComp components, uint256 id) internal {
    IsQuestComponent(getAddressById(components, IsQuestCompID)).set(id);
  }

  function setIsObjective(IUintComp components, uint256 id) internal {
    IsObjectiveComponent(getAddressById(components, IsObjectiveCompID)).set(id);
  }

  function setIsRequirement(IUintComp components, uint256 id) internal {
    IsRequirementComponent(getAddressById(components, IsRequirementCompID)).set(id);
  }

  function setIsReward(IUintComp components, uint256 id) internal {
    IsRewardComponent(getAddressById(components, IsRewardCompID)).set(id);
  }

  function setIndex(IUintComp components, uint256 id, uint32 index) internal {
    IndexComponent(getAddressById(components, IndexCompID)).set(id, index);
  }

  function setQuestIndex(IUintComp components, uint256 id, uint32 questIndex) internal {
    IndexQuestComponent(getAddressById(components, IndexQuestCompID)).set(id, questIndex);
  }

  function setLogicType(IUintComp components, uint256 id, string memory logicType) internal {
    LogicTypeComponent(getAddressById(components, LogicTypeCompID)).set(id, logicType);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
  }

  function setTime(IUintComp components, uint256 id, uint256 time) internal {
    TimeComponent(getAddressById(components, TimeCompID)).set(id, time);
  }

  function setType(IUintComp components, uint256 id, string memory _type) internal {
    TypeComponent(getAddressById(components, TypeCompID)).set(id, _type);
  }

  /////////////////
  // UNSETTERS

  function unsetBalance(IUintComp components, uint256 id) internal {
    if (BalanceComponent(getAddressById(components, BalanceCompID)).has(id)) {
      BalanceComponent(getAddressById(components, BalanceCompID)).remove(id);
    }
  }

  function unsetConditionOwner(IUintComp components, uint256 id) internal {
    if (IdOwnsConditionComponent(getAddressById(components, IdOwnsCondCompID)).has(id)) {
      IdOwnsConditionComponent(getAddressById(components, IdOwnsCondCompID)).remove(id);
    }
  }

  function unsetIsRegistry(IUintComp components, uint256 id) internal {
    if (IsRegistryComponent(getAddressById(components, IsRegCompID)).has(id)) {
      IsRegistryComponent(getAddressById(components, IsRegCompID)).remove(id);
    }
  }

  function unsetIsRepeatable(IUintComp components, uint256 id) internal {
    if (IsRepeatableComponent(getAddressById(components, IsRepeatableCompID)).has(id)) {
      IsRepeatableComponent(getAddressById(components, IsRepeatableCompID)).remove(id);
    }
  }

  function unsetIsQuest(IUintComp components, uint256 id) internal {
    if (IsQuestComponent(getAddressById(components, IsQuestCompID)).has(id)) {
      IsQuestComponent(getAddressById(components, IsQuestCompID)).remove(id);
    }
  }

  function unsetIsObjective(IUintComp components, uint256 id) internal {
    if (IsObjectiveComponent(getAddressById(components, IsObjectiveCompID)).has(id)) {
      IsObjectiveComponent(getAddressById(components, IsObjectiveCompID)).remove(id);
    }
  }

  function unsetIsRequirement(IUintComp components, uint256 id) internal {
    if (IsRequirementComponent(getAddressById(components, IsRequirementCompID)).has(id)) {
      IsRequirementComponent(getAddressById(components, IsRequirementCompID)).remove(id);
    }
  }

  function unsetIsReward(IUintComp components, uint256 id) internal {
    if (IsRewardComponent(getAddressById(components, IsRewardCompID)).has(id)) {
      IsRewardComponent(getAddressById(components, IsRewardCompID)).remove(id);
    }
  }

  function unsetIndex(IUintComp components, uint256 id) internal {
    if (IndexComponent(getAddressById(components, IndexCompID)).has(id)) {
      IndexComponent(getAddressById(components, IndexCompID)).remove(id);
    }
  }

  function unsetQuestIndex(IUintComp components, uint256 id) internal {
    if (IndexQuestComponent(getAddressById(components, IndexQuestCompID)).has(id)) {
      IndexQuestComponent(getAddressById(components, IndexQuestCompID)).remove(id);
    }
  }

  function unsetLogicType(IUintComp components, uint256 id) internal {
    if (LogicTypeComponent(getAddressById(components, LogicTypeCompID)).has(id)) {
      LogicTypeComponent(getAddressById(components, LogicTypeCompID)).remove(id);
    }
  }

  function unsetName(IUintComp components, uint256 id) internal {
    if (NameComponent(getAddressById(components, NameCompID)).has(id)) {
      NameComponent(getAddressById(components, NameCompID)).remove(id);
    }
  }

  function unsetTime(IUintComp components, uint256 id) internal {
    if (TimeComponent(getAddressById(components, TimeCompID)).has(id)) {
      TimeComponent(getAddressById(components, TimeCompID)).remove(id);
    }
  }

  function unsetType(IUintComp components, uint256 id) internal {
    if (TypeComponent(getAddressById(components, TypeCompID)).has(id)) {
      TypeComponent(getAddressById(components, TypeCompID)).remove(id);
    }
  }

  /////////////////
  // QUERIES

  // get registry entry by Quest index
  function getByQuestIndex(
    IUintComp components,
    uint32 index
  ) internal view returns (uint256 result) {
    result = genQuestID(index);
    return IsQuestComponent(getAddressById(components, IsQuestCompID)).has(result) ? result : 0;
  }

  // get Objectives by Quest index
  function getObjectivesByQuestIndex(
    IUintComp components,
    uint32 index
  ) internal view returns (uint256[] memory) {
    return getConditionsByQuestIndex(components, genObjPtr(index));
  }

  // get requirements by Quest index
  function getRequirementsByQuestIndex(
    IUintComp components,
    uint32 index
  ) internal view returns (uint256[] memory) {
    return getConditionsByQuestIndex(components, genReqPtr(index));
  }

  // get reward by Quest index
  function getRewardsByQuestIndex(
    IUintComp components,
    uint32 index
  ) internal view returns (uint256[] memory) {
    return getConditionsByQuestIndex(components, genRwdPtr(index));
  }

  function getConditionsByQuestIndex(
    IUintComp components,
    uint256 pointer
  ) internal view returns (uint256[] memory) {
    return
      IdOwnsConditionComponent(getAddressById(components, IdOwnsCondCompID)).getEntitiesWithValue(
        pointer
      );
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
