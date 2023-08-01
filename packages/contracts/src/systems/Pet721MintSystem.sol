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

contract Pet721MintSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  // no limits check implemented here - Mint20 is the only one with limits
  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 amount = abi.decode(arguments, (uint256));
    require(amount > 0, "Pet721Mint: must be > 0");

    // get the account for the caller (owner)
    // check that it exists and is in the correct room
    uint256 accountID = LibAccount.getByOwner(components, msg.sender);
    require(accountID != 0, "Pet721Mint: no account");
    require(
      LibAccount.getLocation(components, accountID) == ROOM,
      "Pet721Mint: must be in room 4 "
    );

    // burn the $KAMI, implicitly checks balance
    LibMint20.burn(world, msg.sender, amount);

    // Create each pet, commit random, mint the token
    uint256 index = LibPet721.getCurrentSupply(world) + 1;
    uint256[] memory petIDs = new uint256[](amount);
    for (uint256 i; i < amount; i++) {
      uint256 petID = LibPet.create(world, components, accountID, index + i);
      LibRandom.setRevealBlock(components, petID, block.number);
      LibPet721.mintInGame(world, index + i);

      petIDs[i] = petID;
    }

    // update num minted
    uint256 numMinted = LibAccount.getPetsMinted(components, accountID);
    LibAccount.setPetsMinted(world, components, accountID, numMinted + amount);

    return abi.encode(petIDs);
  }

  // TODO: after transitioning to mint only, this should be the only mint function left
  function executeTyped(uint256 amount) public returns (bytes memory) {
    return execute(abi.encode(amount));
  }
}
