// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";
import { LibLootbox } from "libraries/LibLootbox.sol";

uint256 constant ID = uint256(keccak256("system.Lootbox.Reveal.Start"));

// @notice start the reveal process for a lootbox
contract LootboxStartRevealSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 index, uint256 amt) = abi.decode(arguments, (uint256, uint256));

    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    require(accountID != 0, "no account");

    uint256 invID = LibInventory.get(components, accountID, index);
    require(invID != 0, "no lootboxes");

    require(amt <= 10, "LootboxStartReveal: max 10");

    uint256 regID = LibRegistryItem.getByInstance(components, invID);
    require(LibLootbox.isLootbox(components, regID), "LootboxStartReveal: not lootbox");

    uint256 revealID = LibLootbox.startReveal(world, components, invID, amt);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);
    return abi.encode(revealID);
  }

  function executeTyped(uint256 index, uint256 amt) public returns (bytes memory) {
    return execute(abi.encode(index, amt));
  }
}
