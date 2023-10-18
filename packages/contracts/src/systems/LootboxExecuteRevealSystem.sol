// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibLootbox } from "libraries/LibLootbox.sol";
import { LibRandom } from "libraries/LibRandom.sol";

// TEMP
import { LibQuery } from "solecs/LibQuery.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { getAddressById, getComponentById, addressToEntity } from "solecs/utils.sol";
import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IsLootboxComponent, ID as IsLootboxCompID } from "components/IsLootboxComponent.sol";
import { BlockRevealComponent, ID as BlockRevealCompID } from "components/BlockRevealComponent.sol";

uint256 constant ID = uint256(keccak256("system.Lootbox.Reveal.Execute"));

// @notice reveals lootbox and distributes items
contract LootboxExecuteRevealSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  // TEMP hopper function to make it possible to execute lootboxes from client CLI
  // will be removed when we have a proper UI
  function tempExecute() public returns (bytes memory) {
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsLootboxCompID), "");
    fragments[1] = QueryFragment(
      QueryType.Has,
      getComponentById(components, BlockRevealCompID),
      ""
    );
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdHolderCompID),
      abi.encode(accountID)
    );

    // only works for instance
    uint256 id = LibQuery.query(fragments)[0];

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

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));

    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    require(accountID != 0, "no account");
    require(accountID == LibLootbox.getHolder(components, id), "not ur lootbox");
    require(
      LibLootbox.isLootbox(components, id) && LibRandom.hasRevealBlock(components, id),
      "LootboxExeRev: not reveal entity"
    );

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
