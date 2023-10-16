// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibLootbox } from "libraries/LibLootbox.sol";
import { LibRandom } from "libraries/LibRandom.sol";

uint256 constant ID = uint256(keccak256("system.Lootbox.Reveal.Execute"));

// @notice reveals lootbox and distributes items
contract LootboxExecuteRevealSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));

    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    require(accountID != 0, "no account");
    require(accountID == LibLootbox.getHolder(components, id), "not ur lootbox");

    LibLootbox.executeReveal(world, components, id, accountID);

    // Account data logging
    LibLootbox.logIncOpened(
      world,
      components,
      accountID,
      LibLootbox.getIndex(components, id),
      LibLootbox.getBalance(components, id)
    );
    LibLootbox.deleteReveal(components, id);

    LibAccount.updateLastBlock(components, accountID);

    return "";
  }

  function forceReveal(uint256 id) public onlyOwner {
    LibRandom.setRevealBlock(components, id, block.number - 1);

    uint256 accountID = LibLootbox.getHolder(components, id);
    LibLootbox.executeReveal(world, components, id, accountID);
    LibLootbox.logIncOpened(
      world,
      components,
      accountID,
      LibLootbox.getIndex(components, id),
      LibLootbox.getBalance(components, id)
    );
    LibLootbox.deleteReveal(components, id);
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
