// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { LibArray } from "libraries/utils/LibArray.sol";
import { LibCommit } from "libraries/LibCommit.sol";
import { LibGacha } from "libraries/LibGacha.sol";

uint256 constant ID = uint256(keccak256("system.kami.gacha.reveal"));

/// @notice reveals gacha results. owner agnostic - reveal is sent to original account
contract KamiGachaRevealSystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function reveal(uint256[] memory commitIDs) external returns (uint256[] memory) {
    if (commitIDs.length == 0) revert("need commits to reveal");
    LibArray.sortAndVerifyNoRepeats(commitIDs); // sort in place in this step
    LibGacha.checkAndExtractIsCommit(components, commitIDs);

    // sorts commits by cronological order via entityID
    uint256[] memory kamiIDs = LibGacha.selectPets(components, commitIDs);
    LibGacha.withdrawPets(components, kamiIDs, commitIDs);

    return kamiIDs;
  }

  /// @notice admin reveal if user misses 256 block window
  function forceReveal(
    uint256[] memory commitIDs
  ) external onlyCommManager(components) returns (uint256[] memory) {
    if (commitIDs.length == 0) revert("need commits to reveal");
    LibArray.sortAndVerifyNoRepeats(commitIDs); // sort in place in this step
    LibGacha.checkAndExtractIsCommit(components, commitIDs);

    // checks if blockhash is not available
    if (LibCommit.isAvailable(components, commitIDs)) revert("no need for force reveal");

    // generate new seeds
    LibCommit.resetBlocks(components, commitIDs);

    // regular flow
    uint256[] memory kamiIDs = LibGacha.selectPets(components, commitIDs);
    LibGacha.withdrawPets(components, kamiIDs, commitIDs);

    return kamiIDs;
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }
}
