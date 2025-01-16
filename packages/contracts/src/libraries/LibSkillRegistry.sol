// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { CostComponent, ID as CostCompID } from "components/CostComponent.sol";
import { DescriptionComponent, ID as DescCompID } from "components/DescriptionComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { IndexSkillComponent, ID as IndexSkillCompID } from "components/IndexSkillComponent.sol";
import { IDParentComponent, ID as IDParentCompID } from "components/IDParentComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";
import { LogicTypeComponent, ID as LogicTypeCompID } from "components/LogicTypeComponent.sol";
import { MaxComponent, ID as MaxCompID } from "components/MaxComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

import { LibArray } from "libraries/utils/LibArray.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibFor } from "libraries/utils/LibFor.sol";

import { LibBonus } from "libraries/LibBonus.sol";
import { Condition, LibConditional } from "libraries/LibConditional.sol";

/// @notice A registry for Skill related entities
/** @dev skills use the registry + instance pattern
 * registry shape:
 *  - skillIndex
 *  - isRegistry + isSkill
 *  - name
 *  - cost
 *  - max
 *  - mediaURI
 *  - for (type of entity - likely Pet/Account)
 *  - skill tree (optional) [subtype component]
 *    - bonus for skill tree points per skill (cost)
 *    - type component (tree name)
 *    - level component (tree tier)
 *  - bonuses (using LibBonus)
 *
 * Skill trees:
 *   implemented as bonuses
 *
 */
library LibSkillRegistry {
  using LibString for string;

  /////////////////
  // INTERACTIONS

  function create(
    IUintComp components,
    uint32 skillIndex,
    string memory for_,
    string memory name,
    string memory description,
    uint256 cost,
    uint256 max,
    string memory tree,
    uint256 treeTier,
    string memory media
  ) internal returns (uint256 id) {
    id = genID(skillIndex);
    LibEntityType.set(components, id, "SKILL");
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).set(id);

    IndexSkillComponent(getAddrByID(components, IndexSkillCompID)).set(id, skillIndex);
    CostComponent(getAddrByID(components, CostCompID)).set(id, cost);
    DescriptionComponent(getAddrByID(components, DescCompID)).set(id, description);
    NameComponent(getAddrByID(components, NameCompID)).set(id, name);
    MaxComponent(getAddrByID(components, MaxCompID)).set(id, max);
    MediaURIComponent(getAddrByID(components, MediaURICompID)).set(id, media);

    // adding skill tree - implemented as a Bonus
    if (!tree.eq("")) {
      addBonus(components, skillIndex, genTreeType(tree), int256(cost));
      LevelComponent(getAddrByID(components, LevelCompID)).set(id, treeTier);
      TypeComponent(getAddrByID(components, TypeCompID)).set(id, tree);
    }

    LibFor.set(components, id, for_);
  }

  function addBonus(
    IUintComp components,
    uint32 skillIndex,
    string memory type_,
    int256 value
  ) internal returns (uint256) {
    // skill bonuses are permanent, linked to skill instance
    return LibBonus.regCreate(components, genBonusAnchor(skillIndex), type_, "", 0, value);
  }

  function addRequirement(
    IWorld world,
    IUintComp components,
    uint32 skillIndex,
    Condition memory data
  ) internal returns (uint256) {
    return LibConditional.createFor(world, components, data, genReqAnchor(skillIndex));
  }

  function remove(IUintComp components, uint32 index) internal {
    uint256 id = genID(index);

    IsRegistryComponent(getAddrByID(components, IsRegCompID)).remove(id);
    LibEntityType.remove(components, id);
    IndexSkillComponent(getAddrByID(components, IndexSkillCompID)).remove(id);
    CostComponent(getAddrByID(components, CostCompID)).remove(id);
    DescriptionComponent(getAddrByID(components, DescCompID)).remove(id);
    NameComponent(getAddrByID(components, NameCompID)).remove(id);
    MaxComponent(getAddrByID(components, MaxCompID)).remove(id);
    MediaURIComponent(getAddrByID(components, MediaURICompID)).remove(id);
    LibFor.remove(components, id);

    // remove skill tree - bonus removed below
    LevelComponent(getAddrByID(components, LevelCompID)).remove(id);
    TypeComponent(getAddrByID(components, TypeCompID)).remove(id);

    uint256[] memory reqs = queryRequirements(components, index);
    for (uint256 i; i < reqs.length; i++) LibConditional.remove(components, reqs[i]);

    uint256[] memory bonuses = queryBonuses(components, index);
    LibBonus.regRemove(components, bonuses);
  }

  /////////////////
  // GETTERS

  function getSkillIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexSkillComponent(getAddrByID(components, IndexSkillCompID)).get(id);
  }

  function getCost(IUintComp components, uint256 id) internal view returns (uint256) {
    return CostComponent(getAddrByID(components, CostCompID)).get(id);
  }

  function getCost(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (uint256[] memory) {
    return CostComponent(getAddrByID(components, CostCompID)).get(ids);
  }

  function getMax(IUintComp components, uint256 id) internal view returns (uint256) {
    return MaxComponent(getAddrByID(components, MaxCompID)).get(id);
  }

  function getTree(
    IUintComp components,
    uint256 id
  ) internal view returns (bool, string memory, uint256) {
    TypeComponent treeComp = TypeComponent(getAddrByID(components, TypeCompID));
    if (!treeComp.has(id)) return (false, "", 0);
    return (
      true,
      genTreeType(treeComp.get(id)),
      LevelComponent(getAddrByID(components, LevelCompID)).get(id)
    );
  }

  /////////////////
  // QUERIES

  // get registry entry by Skill index
  function getByIndex(IUintComp components, uint32 index) internal view returns (uint256 result) {
    uint256 id = genID(index);
    return LibEntityType.isShape(components, id, "SKILL") ? id : 0;
  }

  // get requirements by Skill index
  function queryRequirements(
    IUintComp components,
    uint32 index
  ) internal view returns (uint256[] memory) {
    return LibConditional.queryFor(components, genReqAnchor(index));
  }

  function queryBonuses(
    IUintComp components,
    uint32 skillIndex
  ) internal view returns (uint256[] memory) {
    return LibBonus.queryByParent(components, genBonusAnchor(skillIndex));
  }

  ////////////////////
  // UTILS

  function genID(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("registry.skill", index)));
  }

  function genID(uint32[] memory indices) internal pure returns (uint256[] memory ids) {
    ids = new uint256[](indices.length);
    for (uint256 i; i < indices.length; i++) ids[i] = genID(indices[i]);
  }

  function genReqAnchor(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("registry.skill.requirement", index)));
  }

  function genBonusAnchor(uint32 index) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("registry.skill.bonus", index)));
  }

  function genTreeType(string memory tree) internal pure returns (string memory) {
    return LibString.concat("SKILL_TREE_", tree);
  }
}
