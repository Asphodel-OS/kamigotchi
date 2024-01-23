// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { System } from "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibMint20 } from "libraries/LibMint20.sol";
import { LibPet721 } from "libraries/LibPet721.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRandom } from "libraries/LibRandom.sol";

uint256 constant ID = uint256(keccak256("system.Pet721.Mint"));
uint256 constant ROOM = 4;

/// @title Pet721MintSystem
/** @notice
 * - handles all minting logic
 * - mints a Pet721 in in-game, unrevealed
 * - spends 1 Mint20 token per Pet721 minted
 * - sets block number for reveal
 */
/// @dev only can be minted in room 4 (vending machine room)
/// @dev to be called by account owner
/// @dev not in use, but can be enabled by admin. system is not deployed by default
contract Pet721MintSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(
      LibConfig.getValueOf(components, "MINT_LEGACY_ENABLED") != 0,
      "721 user mint: not enabled"
    );

    uint256 amount = abi.decode(arguments, (uint256));
    require(amount > 0, "Pet721Mint: must be > 0");

    uint256 accountID = LibAccount.getByOwner(components, msg.sender);
    require(accountID != 0, "Pet721Mint: no account");
    require(
      LibAccount.getLocation(components, accountID) == ROOM,
      "Pet721Mint: must be in room 4 "
    );

    // burn required Mint20, implicitly checks balance
    LibMint20.burn(world, msg.sender, amount);

    // Create each pet, commit random, mint the 721 token
    uint256 index = LibPet721.getCurrentSupply(world) + 1;
    uint256[] memory petIDs = new uint256[](amount);
    for (uint256 i; i < amount; i++) {
      uint256 petID = LibPet.create(world, components, accountID, index + i);
      LibRandom.setRevealBlock(components, petID, block.number);
      LibPet721.mintInGame(world, index + i);

      petIDs[i] = petID;
    }

    // standard logging and tracking
    LibAccount.logIncPetsMinted(world, components, accountID, amount);
    LibAccount.updateLastTs(components, accountID);
    return abi.encode(petIDs);
  }

  function executeTyped(uint256 amount) public returns (bytes memory) {
    return execute(abi.encode(amount));
  }
}
