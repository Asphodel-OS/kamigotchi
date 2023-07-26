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

contract Pet721MintSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  // no limits check implemented here - Mint20 is the only one with limits
  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 amount = abi.decode(arguments, (uint256));
    require(amount > 0, "Pet721MintSystem: amt not > 0");

    // get next index to mint via total supply of ERC721
    uint256 index = LibPet721.getCurrentSupply(world) + 1;

    // get the account for this owner(to). fails if doesnt exist
    uint256 accountID = LibAccount.getByOwner(components, msg.sender);
    require(accountID != 0, "Pet721MintSystem: no account");

    // update num minted
    uint256 numMinted = LibAccount.getPetsMinted(components, accountID);
    LibAccount.setPetsMinted(world, components, accountID, numMinted + amount);

    // burn mint tokens, implicitly checks if owner has enough balance
    LibMint20.burn(world, msg.sender, amount); // msg.sender is owner

    // set return array
    uint256[] memory petIDs = new uint256[](amount);

    // loop to mint for amount
    for (uint256 i; i < amount; i++) {
      // Create the pet, commit random
      uint256 petID = LibPet.create(world, components, accountID, index + i);
      LibRandom.setRevealBlock(components, petID, block.number);

      // Mint the token
      LibPet721.mintInGame(world, index + i);

      // add petID to array
      petIDs[i] = petID;
    }

    return abi.encode(petIDs);
  }

  // TODO: after transitioning to mint only, this should be the only mint function left
  function executeTyped(uint256 amount) public returns (bytes memory) {
    return execute(abi.encode(amount));
  }
}
