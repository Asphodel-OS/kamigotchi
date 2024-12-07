// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";

import { Stat } from "solecs/components/types/Stat.sol";
import { ExperienceComponent, ID as ExpCompID } from "components/ExperienceComponent.sol";
import { IndexRecipeComponent, ID as IndexRecipeCompID } from "components/IndexRecipeComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { KeysComponent, ID as KeysCompID } from "components/KeysComponent.sol";
import { StaminaComponent, ID as StamCompID } from "components/StaminaComponent.sol";
import { ValuesComponent, ID as ValuesCompID } from "components/ValuesComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibArray } from "libraries/utils/LibArray.sol";
import { LibAssigner } from "libraries/LibAssigner.sol";
import { LibComp } from "libraries/utils/LibComp.sol";
import { Condition, LibConditional } from "libraries/LibConditional.sol";
import { LibData } from "libraries/LibData.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibStat } from "libraries/LibStat.sol";

struct Table {
  uint32[] indices;
  uint256[] amts;
}

/** @notice
 * Library for crafting recipes.
 * [inputs] -> [outputs] (basic crafting flow)
 * can be bounded by NPCs (assigners)
 *
 * Shape: id = hash(registryIndex)
 * - IsRegistry
 * - IndexRecipe
 * - Inputs (ID = hash('recipe.inputs', registryIndex))
 *   - Keys (Input indices)
 *   - Values (Input quantities)
 * - Outputs (ID = hash('recipe.outputs', registryIndex))
 *   - Keys (Output indices)
 *   - Values (Output quantities)
 */
library LibRecipe {
  using SafeCastLib for uint256;

  /////////////////
  // SHAPES

  function create(
    IUintComp components,
    uint32 recipeIndex,
    uint32[] memory inputIndices,
    uint256[] memory inputAmts,
    uint32[] memory outputIndices,
    uint256[] memory outputAmts,
    uint256 experience,
    int32 staminaCost
  ) internal returns (uint256 id) {
    id = genID(recipeIndex);
    LibEntityType.set(components, id, "RECIPE");

    KeysComponent keysComp = KeysComponent(getAddrByID(components, KeysCompID));
    ValuesComponent valsComp = ValuesComponent(getAddrByID(components, ValuesCompID));
    IsRegistryComponent(getAddrByID(components, IsRegCompID)).set(id);
    IndexRecipeComponent(getAddrByID(components, IndexRecipeCompID)).set(id, recipeIndex);
    ExperienceComponent(getAddrByID(components, ExpCompID)).set(id, experience);
    StaminaComponent(getAddrByID(components, StamCompID)).set(id, Stat(0, 0, 0, staminaCost));

    // set inputs
    uint256 inputID = genInputID(recipeIndex);
    keysComp.set(inputID, inputIndices);
    valsComp.set(inputID, inputAmts);

    // set outputs
    uint256 outputID = genOutputID(recipeIndex);
    keysComp.set(outputID, outputIndices);
    valsComp.set(outputID, outputAmts);
  }

  function addAssigner(
    IUintComp components,
    uint256 recipeID,
    uint32 recipeIndex,
    uint256 assignerID
  ) internal returns (uint256 id) {
    id = LibAssigner.create(components, assignerID, recipeID);
    LibAssigner.addIndex(
      IndexRecipeComponent(getAddrByID(components, IndexRecipeCompID)),
      recipeIndex,
      id
    );
  }

  function createRequirement(
    IWorld world,
    IUintComp components,
    uint32 recipeIndex,
    Condition memory data
  ) internal returns (uint256 id) {
    id = LibConditional.createFor(world, components, data, genReqAnchor(recipeIndex));
  }

  function remove(IUintComp components, uint32 recipeIndex, uint256 id) internal {
    LibEntityType.remove(components, id);

    IndexRecipeComponent indexComp = IndexRecipeComponent(
      getAddrByID(components, IndexRecipeCompID)
    );
    KeysComponent keysComp = KeysComponent(getAddrByID(components, KeysCompID));
    ValuesComponent valsComp = ValuesComponent(getAddrByID(components, ValuesCompID));

    IsRegistryComponent(getAddrByID(components, IsRegCompID)).remove(id);
    indexComp.remove(id);

    uint256 inputID = genInputID(recipeIndex);
    keysComp.remove(inputID);
    valsComp.remove(inputID);

    uint256 outputID = genOutputID(recipeIndex);
    keysComp.remove(outputID);
    valsComp.remove(outputID);

    uint256[] memory assigners = LibAssigner.getAll(components, id);
    for (uint256 i; i < assigners.length; i++)
      LibAssigner.remove(components, indexComp, assigners[i]);

    uint256[] memory requirements = getRequirements(components, recipeIndex);
    for (uint256 i; i < requirements.length; i++)
      LibConditional.remove(components, requirements[i]);
  }

  /////////////////
  // INTERACTIONS

  function beforeCraft(
    IUintComp components,
    uint256 recipeID,
    uint256 amt,
    uint256 accID
  ) internal {
    // pay stamina cost
    int32 stCost = StaminaComponent(getAddrByID(components, StamCompID)).get(recipeID).sync;
    LibAccount.depleteStamina(components, accID, uint32(stCost) * amt.toUint32());
  }

  function craft(
    IUintComp components,
    uint32 recipeIndex,
    uint256 rolls,
    uint256 accID
  ) internal returns (uint32[] memory, uint256[] memory) {
    (Table memory input, Table memory output) = getIO(components, recipeIndex, rolls);

    // use inputs (balance implicitly checked)
    LibInventory.decForBatch(components, accID, input.indices, input.amts);

    // send outputs
    LibInventory.incForBatch(components, accID, output.indices, output.amts);

    return (output.indices, output.amts);
  }

  function afterCraft(IUintComp components, uint256 recipeID, uint256 amt, uint256 accID) internal {
    // add account experience
    ExperienceComponent expComp = ExperienceComponent(getAddrByID(components, ExpCompID));
    uint256 xp = expComp.safeGet(recipeID);
    if (xp > 0) expComp.inc(accID, amt * xp);
  }

  /////////////////
  // CHECKERS

  function verifyRequirements(IUintComp components, uint32 recipeIndex, uint256 accID) public view {
    uint256[] memory reqIDs = getRequirements(components, recipeIndex);
    if (!LibConditional.check(components, reqIDs, accID)) revert("Recipe: reqs not met");
  }

  /////////////////
  // GETTERS

  function get(IUintComp components, uint32 recipeIndex) internal view returns (uint256) {
    IndexRecipeComponent indexComp = IndexRecipeComponent(
      getAddrByID(components, IndexRecipeCompID)
    );
    uint256 id = genID(recipeIndex);
    return indexComp.has(id) ? id : 0;
  }

  // input output ingredients
  function getIO(
    IUintComp components,
    uint32 recipeIndex,
    uint256 rolls
  ) internal view returns (Table memory, Table memory) {
    uint256[] memory ioIDs = new uint256[](2);
    ioIDs[0] = genInputID(recipeIndex);
    ioIDs[1] = genOutputID(recipeIndex);
    uint32[][] memory indices = KeysComponent(getAddrByID(components, KeysCompID)).get(ioIDs);
    uint256[][] memory amts = ValuesComponent(getAddrByID(components, ValuesCompID)).get(ioIDs);

    // multiply by amount
    LibArray.multiply(amts[0], rolls);
    LibArray.multiply(amts[1], rolls);

    return (Table(indices[0], amts[0]), Table(indices[1], amts[1]));
  }

  function getRequirements(
    IUintComp components,
    uint32 recipeIndex
  ) internal view returns (uint256[] memory) {
    return LibConditional.queryFor(components, genReqAnchor(recipeIndex));
  }

  /////////////////
  // UTILS

  function genID(uint32 recipeIndex) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("registry.recipe", recipeIndex)));
  }

  function genInputID(uint32 recipeIndex) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("recipe.input", recipeIndex)));
  }

  function genOutputID(uint32 recipeIndex) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("recipe.output", recipeIndex)));
  }

  function genReqAnchor(uint32 recipeIndex) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("recipe.requirement", recipeIndex)));
  }

  /////////////////
  // LOGGING

  function logCraft(IUintComp components, uint256 accID, uint32 recipeIndex, uint256 amt) public {
    LibData.inc(components, accID, recipeIndex, "CRAFT_TOTAL", amt);
  }
}
