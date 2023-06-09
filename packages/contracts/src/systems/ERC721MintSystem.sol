// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { System } from "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";

import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibERC721 } from "libraries/LibERC721.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRandom } from "libraries/LibRandom.sol";

uint256 constant ID = uint256(keccak256("system.ERC721.Mint"));

contract ERC721MintSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (address to, uint256 amount) = abi.decode(arguments, (address, uint256));
    uint256 index = LibERC721.getCurrentSupply(world) + 1;

    // Get the account for this owner(to). fails if doesnt exist
    uint256 accountID = LibAccount.getByOwner(components, to);
    require(accountID != 0, "ERC721MintSystem: no account");

    // set return array
    uint256[] memory petIDs = new uint256[](amount);

    // loop to mint for amount
    for (uint256 i; i < amount; i++) {
      // Create the pet, commit random
      uint256 petID = LibPet.create(world, components, accountID, index + i);
      LibRandom.setRevealBlock(components, petID, block.number);

      // Mint the token
      LibERC721.mintInGame(world, index + i);

      // add petID to array
      petIDs[i] = petID;
    }

    return abi.encode(petIDs);
  }

  function executeTyped(address to, uint256 amount) public returns (bytes memory) {
    return execute(abi.encode(to, amount));
  }
}
