// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibItemRegistry } from "libraries/LibItemRegistry.sol";
import { LibLootbox } from "libraries/LibLootbox.sol";

uint256 constant ID = uint256(keccak256("system.Lootbox.Reveal.Start"));

// @notice start the reveal process for a lootbox
contract LootboxStartRevealSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint32 index, uint256 amt) = abi.decode(arguments, (uint32, uint256));
    require(amt <= 10, "LootboxStartReveal: max 10");

    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    uint256 regID = LibItemRegistry.getByIndex(components, index);
    require(LibLootbox.isLootbox(components, regID), "LootboxStartReveal: not lootbox");

    uint256 revealID = LibLootbox.commit(world, components, accID, index, amt);

    // standard logging and tracking
    LibLootbox.logIncOpened(components, accID, index, amt);
    LibAccount.updateLastTs(components, accID);

    return abi.encode(revealID);
  }

  function executeTyped(uint32 index, uint256 amt) public returns (bytes memory) {
    return execute(abi.encode(index, amt));
  }
}
