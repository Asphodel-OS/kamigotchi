// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibLootbox } from "libraries/LibLootbox.sol";
import { LibRandom } from "libraries/utils/LibRandom.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";

uint256 constant ID = uint256(keccak256("system.Lootbox.Reveal.Execute"));

// @notice reveals lootbox and distributes items
contract LootboxExecuteRevealSystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));

    uint256 accID = LibAccount.getByOperator(components, msg.sender);
    require(accID == LibLootbox.getHolder(components, id), "not ur lootbox");
    require(
      LibLootbox.isLootbox(components, id) && LibRandom.hasRevealBlock(components, id),
      "LootboxExeRev: not reveal entity"
    );

    LibLootbox.executeReveal(world, components, id, accID);

    // standard logging and tracking
    LibLootbox.logIncOpened(
      world,
      components,
      accID,
      LibLootbox.getIndex(components, id),
      LibLootbox.getBalance(components, id)
    );
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function forceReveal(uint256 id) public onlyCommManager(components) {
    LibRandom.setRevealBlock(components, id, block.number - 1);

    uint256 accID = LibLootbox.getHolder(components, id);
    LibLootbox.executeReveal(world, components, id, accID);
    LibLootbox.logIncOpened(
      world,
      components,
      accID,
      LibLootbox.getIndex(components, id),
      LibLootbox.getBalance(components, id)
    );
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
