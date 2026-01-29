// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibCommit } from "libraries/LibCommit.sol";
import { LibSacrifice } from "libraries/LibSacrifice.sol";

uint256 constant ID = uint256(keccak256("system.kami.sacrifice.reveal"));

/**
 * @title KamiSacrificeRevealSystem
 * @notice System for revealing sacrifice loot after commit
 * @dev Must be called at least 1 block after commit (for blockhash availability)
 *
 * The reveal selects a random item from the appropriate droptable:
 * - Normal droptable for regular sacrifices
 * - Uncommon pity droptable every 20 sacrifices
 * - Rare pity droptable every 100 sacrifices
 */
contract KamiSacrificeRevealSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  /**
   * @notice Reveals sacrifice loot for one or more commits
   * @param arguments ABI-encoded uint256[] commitIDs
   * @return Empty bytes (items are distributed directly to inventory)
   */
  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256[] memory commitIDs = abi.decode(arguments, (uint256[]));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // Validate commits belong to caller and are sacrifice commits
    LibSacrifice.checkAndExtractIsCommit(components, commitIDs);

    // Filter out already-revealed or non-existent commits
    LibCommit.filterInvalid(components, commitIDs);

    // Reveal and distribute loot
    LibSacrifice.reveal(world, components, commitIDs);

    // Update account timestamp
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  /**
   * @notice Typed wrapper for revealing a single commit
   * @param commitID The commit entity ID to reveal
   */
  function executeTyped(uint256 commitID) public {
    uint256[] memory commitIDs = new uint256[](1);
    commitIDs[0] = commitID;
    execute(abi.encode(commitIDs));
  }

  /**
   * @notice Typed wrapper for revealing multiple commits
   * @param commitIDs Array of commit entity IDs to reveal
   */
  function executeTypedBatch(uint256[] memory commitIDs) public {
    execute(abi.encode(commitIDs));
  }
}
