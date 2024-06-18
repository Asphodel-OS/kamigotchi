// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibString } from "solady/utils/LibString.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibGacha } from "libraries/LibGacha.sol";
import { LibPet } from "libraries/LibPet.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";

uint256 constant ID = uint256(keccak256("system.Pet.Gacha.Reveal"));

/// @notice reveals gacha results. owner agnostic - reveal is sent to original account
contract PetGachaRevealSystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function reveal(uint256[] memory rawCommitIDs) external returns (uint256[] memory) {
    require(rawCommitIDs.length > 0, "need commits to reveal");
    _checkTypes(rawCommitIDs);

    // sorts commits by cronological order via increment
    uint256[] memory commitIDs = LibGacha.sortCommits(components, rawCommitIDs);

    uint256[] memory seeds = LibGacha.extractSeeds(components, commitIDs);
    uint256[] memory petIDs = LibGacha.selectPets(components, seeds);
    _transferPets(commitIDs, petIDs);

    return petIDs;
  }

  /// @notice admin reveal if user misses 256 block window
  function forceReveal(
    uint256[] memory commitIDs
  ) external onlyCommManager(components) returns (uint256[] memory) {
    require(commitIDs.length > 0, "need commits to reveal");
    _checkTypes(commitIDs);

    // checks if blockhash is not available
    uint256[] memory revealBlocks = LibGacha.extractRevealBlockBatch(components, commitIDs);
    for (uint256 i; i < revealBlocks.length; i++) {
      require(uint256(blockhash(revealBlocks[i])) == 0, "no need for force reveal");
    }

    // generate new seeds
    uint256[] memory seeds = LibGacha.extractIncrementBatch(components, commitIDs);
    uint256 bhash = uint256(blockhash(block.number - 1));
    for (uint256 i; i < seeds.length; i++)
      seeds[i] = uint256(keccak256(abi.encodePacked(seeds[i], bhash)));

    // select and send pets
    uint256[] memory petIDs = LibGacha.selectPets(components, seeds);
    _transferPets(commitIDs, petIDs);

    return petIDs;
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }

  function _checkTypes(uint256[] memory commitIDs) internal {
    string[] memory types = LibGacha.extractTypeBatch(components, commitIDs);
    for (uint256 i; i < commitIDs.length; i++)
      require(LibString.eq(types[i], "GACHA_COMMIT"), "not gacha commit");
  }

  function _transferPets(uint256[] memory commitIDs, uint256[] memory petIDs) internal {
    uint256[] memory accountIDs = LibGacha.extractAccountBatch(components, commitIDs);
    uint256[] memory rerollCounts = LibGacha.extractRerollBatch(components, commitIDs);
    LibGacha.withdrawPets(components, petIDs, accountIDs, rerollCounts);
  }
}
