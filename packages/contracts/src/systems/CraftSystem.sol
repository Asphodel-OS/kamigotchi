// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibRecipe } from "libraries/LibRecipe.sol";

uint256 constant ID = uint256(keccak256("system.craft"));

contract CraftSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint32 index, uint256 amt) = abi.decode(arguments, (uint32, uint256));
    uint256 regID = LibRecipe.get(components, index);
    if (regID == 0) revert("Recipe: does not exist");

    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // check requirements
    LibRecipe.verifyRequirements(components, index, accID);

    LibAccount.sync(components, accID);
    LibRecipe.beforeCraft(components, regID, amt, accID);
    (uint32[] memory itemIndices, uint256[] memory amts) = LibRecipe.craft(
      components,
      index,
      amt,
      accID
    );
    LibRecipe.afterCraft(components, regID, amt, accID);

    // standard logging and tracking
    LibRecipe.logCraft(components, accID, index, amt);
    LibAccount.updateLastTs(components, accID);
    return abi.encode(0);
  }

  function executeTyped(uint32 index, uint256 amt) public returns (bytes memory) {
    return execute(abi.encode(index, amt));
  }
}
