// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { System } from "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibERC721 } from "libraries/LibERC721.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRandom } from "libraries/LibRandom.sol";

uint256 constant ID = uint256(keccak256("system.ERC721.Mint"));

contract ERC721MintSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function publicMint(uint256 amount) public payable returns (bytes memory) {
    uint256 price = LibConfig.getValueOf(components, "MINT_PRICE");
    require(msg.value >= price * amount, "ERC721MintSystem: not enough ETH");
    return _mintProcess(amount);
  }

  function whitelistMint() public returns (bytes memory) {
    // TODO: implement whitelist checks -> if on whitelist and if minted before
    return _mintProcess(1);
  }

  function _mintProcess(uint256 amount) internal returns (bytes memory) {
    // get next index to mint via total supply of ERC721
    uint256 index = LibERC721.getCurrentSupply(world) + 1;

    // get the account for this owner(to). fails if doesnt exist
    uint256 accountID = LibAccount.getByOwner(components, msg.sender);
    require(accountID != 0, "ERC721MintSystem: no account");

    // check for max mint, update num minted
    uint256 numMinted = LibAccount.getPetsMinted(components, accountID);
    require(
      numMinted + amount <= LibConfig.getValueOf(components, "MINT_MAX"),
      "ERC721MintSystem: max minted"
    );
    LibAccount.setPetsMinted(world, components, accountID, numMinted + amount);

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

  function withdraw() external onlyOwner {
    payable(owner()).transfer(address(this).balance);
  }

  // execute function disabled to allow for payable functions
  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "ERC721MintSystem: deprecated");
  }

  function executeTyped(uint256 amount) public returns (bytes memory) {
    return execute(abi.encode(amount));
  }
}
