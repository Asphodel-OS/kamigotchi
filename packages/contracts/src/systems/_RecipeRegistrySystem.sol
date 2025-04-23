// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { LibRecipe } from "libraries/LibRecipe.sol";
import { Condition } from "libraries/LibConditional.sol";

uint256 constant ID = uint256(keccak256("system.recipe.registry"));

contract _RecipeRegistrySystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function create(bytes memory arguments) public onlyAdmin(components) returns (uint256) {
    (
      uint32 index,
      uint32[] memory iIndices,
      uint256[] memory iAmts,
      uint32[] memory oIndices,
      uint256[] memory oAmts,
      uint256 xp,
      int32 stCost
    ) = abi.decode(arguments, (uint32, uint32[], uint256[], uint32[], uint256[], uint256, int32));

    require(LibRecipe.get(components, index) == 0, "Recipe: index already exists");

    uint256 id = LibRecipe.create(components, index, iIndices, iAmts, oIndices, oAmts, xp, stCost);
    return id;
  }

  function addRequirement(
    uint32 recipeIndex,
    string memory logicType,
    string memory type_,
    uint32 index, // can be empty
    uint32 value, // can be empty
    string memory condFor
  ) public onlyAdmin(components) returns (uint256) {
    return
      LibRecipe.createRequirement(
        world,
        components,
        recipeIndex,
        Condition(logicType, type_, index, value, condFor)
      );
  }

  function remove(uint32 index) public onlyAdmin(components) {
    uint256 regID = LibRecipe.get(components, index);
    require(regID != 0, "Recipe: does not exist");
    LibRecipe.remove(components, index, regID);
  }

  function execute(bytes memory arguments) public onlyAdmin(components) returns (bytes memory) {
    require(false, "not implemented");
  }
}
