// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibSacrifice } from "libraries/LibSacrifice.sol";

uint256 constant ID = uint256(keccak256("system.kami.sacrifice.commit"));

/**
 * @title KamiSacrificeCommitSystem
 * @notice System for sacrificing a kami to receive random loot
 * @dev Uses commit/reveal pattern for fair randomness
 *
 * Requirements:
 * - Kami must be owned by the caller's account
 * - Kami must be in RESTING state (not harvesting, dead, or external)
 * - Only 1 kami can be sacrificed per transaction
 *
 * Pity System:
 * - Every 20 sacrifices: guaranteed uncommon item
 * - Every 100 sacrifices: guaranteed rare item
 */
contract KamiSacrificeCommitSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  /**
   * @notice Sacrifices a kami and creates a commit for loot reveal
   * @param arguments ABI-encoded uint32 kamiIndex (the ERC721 tokenID)
   * @return ABI-encoded uint256 commitID
   */
  function execute(bytes memory arguments) public returns (bytes memory) {
    uint32 kamiIndex = abi.decode(arguments, (uint32));
    uint256 kamiID = LibKami.getByIndex(components, kamiIndex);
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // Checks
    require(kamiID != 0, "kami does not exist");
    LibKami.verifyAccount(components, kamiID, accID);

    // Kami must be in RESTING state to be sacrificed
    string memory state = LibKami.getState(components, kamiID);
    require(LibString.eq(state, "RESTING"), "kami must be resting");

    // Sync kami state before sacrifice (update health, etc)
    LibKami.sync(components, kamiID);

    // Create sacrifice commit (this kills the kami and tracks pity)
    uint256 commitID = LibSacrifice.commit(world, components, kamiID, accID);

    // Update account timestamp
    LibAccount.updateLastTs(components, accID);

    return abi.encode(commitID);
  }

  /**
   * @notice Typed wrapper for execute
   * @param kamiIndex The ERC721 tokenID of the kami to sacrifice
   * @return commitID The commit entity ID for later reveal
   */
  function executeTyped(uint32 kamiIndex) public returns (uint256 commitID) {
    bytes memory result = execute(abi.encode(kamiIndex));
    return abi.decode(result, (uint256));
  }
}
