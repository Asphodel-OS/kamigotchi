// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibCommit } from "libraries/LibCommit.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibLootbox } from "libraries/LibLootbox.sol";
import { LibRandom } from "libraries/utils/LibRandom.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";

uint256 constant ID = uint256(keccak256("system.Lootbox.Reveal.Execute"));

// @notice reveals lootbox and distributes items
contract LootboxExecuteRevealSystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256[] memory ids = abi.decode(arguments, (uint256[]));

    // checks
    require(ids.length > 0, "LootboxExeRev: no reveals");
    uint256[] memory holderIDs = LibLootbox.extractHolders(components, ids);
    uint32[] memory boxIndices = LibLootbox.extractIndices(components, ids);
    require(LibLootbox.extractAreCommits(components, ids), "LootboxExeRev: not reveal entity");
    require(LibLootbox.isSameHolder(holderIDs), "LootboxExeRev: not same holder");
    require(LibLootbox.isSameBox(boxIndices), "LootboxExeRev: not same box");

    uint256 accID = holderIDs[0];
    uint32 boxIndex = boxIndices[0];

    // revealing
    LibLootbox.reveal(components, accID, boxIndex, ids);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function forceReveal(uint256 id) public onlyCommManager(components) {
    // match to array format
    uint256[] memory ids = new uint256[](1);
    ids[0] = id;

    require(!LibCommit.isAvailable(components, ids), "LootboxExeRev: commit still available");
    require(LibLootbox.extractAreCommits(components, ids), "LootboxExeRev: not reveal entity");
    uint256 accID = LibLootbox.extractHolders(components, ids)[0];
    uint32 boxIndex = LibLootbox.extractIndices(components, ids)[0];

    LibCommit.resetBlocks(components, ids);
    LibLootbox.reveal(components, accID, boxIndex, ids);
  }

  function executeTyped(uint256[] memory ids) public returns (bytes memory) {
    return execute(abi.encode(ids));
  }
}
