// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibAssigner } from "libraries/LibAssigner.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibRecipe } from "libraries/LibRecipe.sol";

uint256 constant ID = uint256(keccak256("system.craft"));

contract CraftSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 assignerID, uint32 index, uint256 amt) = abi.decode(
      arguments,
      (uint256, uint32, uint256)
    );
    uint256 regID = LibRecipe.get(components, index);
    require(regID != 0, "Recipe: does not exist");

    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // check requirements
    require(LibAssigner.check(components, assignerID, regID, accID), "not assigner");
    require(LibRecipe.meetsRequirements(components, index, accID), "Recipe: reqs not met");

    LibRecipe.beforeCraft(components, regID, amt, accID);
    (uint32[] memory itemIndices, uint256[] memory amts) = LibRecipe.craft(
      components,
      index,
      amt,
      accID
    );
    LibRecipe.afterCraft(components, regID, amt, accID);

    // standard logging and tracking
    LibInventory.logItemTotals(components, accID, itemIndices, amts);
    LibRecipe.logCraft(components, accID, index, amt);
    LibAccount.updateLastTs(components, accID);
    return abi.encode(0);
  }

  function executeTyped(
    uint256 assignerID,
    uint32 index,
    uint256 amt
  ) public returns (bytes memory) {
    return execute(abi.encode(assignerID, index, amt));
  }
}
