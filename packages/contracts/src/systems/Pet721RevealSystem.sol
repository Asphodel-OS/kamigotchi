// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { System } from "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibPet721 } from "libraries/LibPet721.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRandom } from "libraries/LibRandom.sol";

uint256 constant ID = uint256(keccak256("system.Pet721.Reveal"));

/// @title Pet721RevealSystem
/// @notice reveals an unrevealed pet!
/** @dev
 * Requires the blockhash to be available (256 blocks after minting)
 * It is expected that the front end handles this automatically
 */
/// @dev not in use, but can be enabled by admin. system is not deployed by default
contract Pet721RevealSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  /// @notice reveals a player's pet, called by operator
  function execute(bytes memory arguments) public returns (bytes memory) {
    require(
      LibConfig.getValueOf(components, "MINT_LEGACY_ENABLED") != 0,
      "721 user mint: not enabled"
    );

    uint256 petIndex = abi.decode(arguments, (uint256));
    uint256 petID = LibPet.indexToID(components, petIndex);

    // checks
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    require(accountID != 0, "PetRevealSystem: no account");
    require(LibPet.getAccount(components, petID) == accountID, "Pet: not urs");
    require(LibPet.isUnrevealed(components, petID), "already revealed!");

    uint256 seed = LibRandom.getSeedBlockhash(LibRandom.getRevealBlock(components, petID));
    LibRandom.removeRevealBlock(components, petID);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);
    LibPet721.updateEvent(world, petIndex);
    return reveal(petID, seed);
  }

  /// @notice a backup in case user misses the 256 block window to reveal
  /// @dev takes previous blockhash for random seed; permissioned assumes caller won't abuse randomness
  /// @dev likely to include other roles in the future just to reveal
  function forceReveal(uint256 petIndex) public onlyOwner returns (bytes memory) {
    uint256 petID = LibPet.indexToID(components, petIndex);
    require(LibPet.isUnrevealed(components, petID), "already revealed!");

    uint256 seed = uint256(blockhash(block.number - 1));
    LibRandom.removeRevealBlock(components, petID);

    LibPet721.updateEvent(world, petIndex);
    return reveal(petID, seed);
  }

  function executeTyped(uint256 petIndex) public returns (bytes memory) {
    return execute(abi.encode(petIndex));
  }

  /// @notice reveals a pet!
  function reveal(uint256 petID, uint256 seed) internal returns (bytes memory) {
    uint256 packed = LibPet721.reveal(world, components, petID, seed); // uses packed array to generate image off-chain

    string memory _baseURI = LibConfig.getValueStringOf(components, "BASE_URI");
    string memory uri = LibString.concat(
      _baseURI,
      LibString.concat(LibString.toString(packed), ".gif")
    );
    LibPet.reveal(components, petID, uri);

    return "";
  }
}
