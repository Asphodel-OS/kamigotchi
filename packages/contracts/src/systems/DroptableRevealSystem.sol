// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { BlockRevealComponent, ID as BlockRevealCompID } from "components/BlockRevealComponent.sol";
import { ForComponent, ID as ForCompID } from "components/ForComponent.sol";
import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibDroptable } from "libraries/LibDroptable.sol";
import { LibCommit } from "libraries/LibCommit.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibRandom } from "libraries/utils/LibRandom.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";

uint256 constant ID = uint256(keccak256("system.droptable.item.reveal"));

// @notice reveals lootbox and distributes items
contract DroptableRevealSystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256[] memory ids = abi.decode(arguments, (uint256[]));

    // checks
    require(ids.length > 0, "LootboxExeRev: no reveals");
    require(LibDroptable.extractAreCommits(components, ids), "LootboxExeRev: not reveal entity");

    // revealing
    LibCommit.filterInvalid(components, ids);
    LibDroptable.reveal(components, ids);
    return "";
  }

  function forceReveal(uint256 id) public onlyCommManager(components) {
    // match to array format
    uint256[] memory ids = new uint256[](1);
    ids[0] = id;

    require(!LibCommit.isAvailable(components, ids), "LootboxExeRev: commit still available");
    require(LibDroptable.extractAreCommits(components, ids), "LootboxExeRev: not reveal entity");

    LibCommit.resetBlocks(components, ids);
    LibDroptable.reveal(components, ids);
  }

  // temporary function to address broken reveals from scav node upgrades
  function replaceBrokenReveal(uint256 id) public onlyCommManager(components) {
    // match to array format
    uint256[] memory ids = new uint256[](1);
    ids[0] = id;

    require(!LibCommit.isAvailable(components, ids), "LootboxExeRev: commit still available");
    require(LibDroptable.extractAreCommits(components, ids), "LootboxExeRev: not reveal entity");

    // removing broken components
    BlockRevealComponent(getAddrByID(components, BlockRevealCompID)).remove(id);
    ForComponent(getAddrByID(components, ForCompID)).remove(id);

    // getting details
    uint256 holderID = IdHolderComponent(getAddrByID(components, IdHolderCompID)).extract(id);
    uint256 amt = ValueComponent(getAddrByID(components, ValueCompID)).extract(id);

    // replacing with lootbox
    LibInventory.incFor(components, holderID, 10001, amt);
  }

  function executeTyped(uint256[] memory ids) public returns (bytes memory) {
    return execute(abi.encode(ids));
  }
}
