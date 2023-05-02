// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { System } from "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";

import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { LibRandom } from "libraries/LibRandom.sol";
import { LibTrait } from "libraries/LibTrait.sol";
import { LibRegistryTrait } from "libraries/LibRegistryTrait.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibStat } from "libraries/LibStat.sol";
import { LibMetadata } from "libraries/LibMetadata.sol";

uint256 constant ID = uint256(keccak256("system.ERC721.metadata"));
uint256 constant _numElements = 5;

contract ERC721MetadataSystem is System {
  string _baseURI;

  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 petIndex = abi.decode(arguments, (uint256));
    uint256 petID = LibPet.indexToID(components, petIndex);

    // checks
    uint256 accountID = LibAccount.getByAddress(components, msg.sender);
    require(LibPet.getAccount(components, petID) == accountID, "Pet: not urs");
    require(LibPet.isUnrevealed(components, petID), "already revealed!");

    uint256 seed = LibRandom.getSeedBlockhash(LibRandom.getRevealBlock(components, petID));
    LibRandom.removeRevealBlock(components, petID);

    return reveal(petID, seed);
  }

  // needed as a backup in case user misses the 256 block window to reveal (25 minutes)
  // pet will be forever locked as unrevealed otherwise
  // takes previous blockhash for random seed; fairly obvious if admin bots randomness
  function forceReveal(uint256 petIndex) public onlyOwner returns (bytes memory) {
    uint256 petID = LibPet.indexToID(components, petIndex);

    // checks
    require(
      uint256(blockhash(LibRandom.getRevealBlock(components, petID))) == 0,
      "adminReveal: blockhash is valid"
    );
    require(LibPet.isUnrevealed(components, petID), "already revealed!");

    uint256 seed = uint256(blockhash(block.number - 1));
    LibRandom.removeRevealBlock(components, petID);

    return reveal(petID, seed);
  }

  // accepts erc721 petIndex as input
  function executeTyped(uint256 petIndex) public returns (bytes memory) {
    return execute(abi.encode(petIndex));
  }

  // sets metadata with a random seed
  // second phase of commit/reveal scheme. pet owners call directly
  function reveal(uint256 petID, uint256 seed) internal returns (bytes memory) {
    // generates array of traits with weighted random
    uint256[] memory traits = LibMetadata.genRandTraits(components, petID, seed);

    // setting metadata
    LibMetadata.assignTraits(components, petID, traits);
    uint256 packed = LibRandom.packArray(traits, 8); // uses packed array to generate image off-chain
    LibPet.setMediaURI(components, petID, LibString.concat(_baseURI, LibString.toString(packed)));
    LibPet.reveal(components, petID);
    return "";
  }

  /*********************
   *  METADATA ASSEMBLER
   **********************/

  function tokenURI(uint256 petIndex) public view returns (string memory) {
    return LibMetadata.getJson(components, petIndex);
  }

  /*********************
   *  CONFIG FUNCTIONS
   **********************/

  function _setBaseURI(string memory baseURI) public onlyOwner {
    _baseURI = baseURI;
  }
}
