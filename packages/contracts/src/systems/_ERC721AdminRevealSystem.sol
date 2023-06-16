// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { System } from "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";

import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibERC721 } from "libraries/LibERC721.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRandom } from "libraries/LibRandom.sol";
import { LibRegistryTrait } from "libraries/LibRegistryTrait.sol";
import { LibStat } from "libraries/LibStat.sol";

uint256 constant ID = uint256(keccak256("system._ERC721.AdminReveal"));

// needed as a backup in case user misses the 256 block window to reveal (8.5 minutes)
// pet will be forever locked as unrevealed otherwise
// takes previous blockhash for random seed; fairly obvious if admin bots randomness

// accepts erc721 petIndex as input
contract _ERC721AdminRevealSystem is System {
  string internal _baseURI;

  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    uint256 petIndex = abi.decode(arguments, (uint256));
    uint256 petID = LibPet.indexToID(components, petIndex);

    require(LibPet.isUnrevealed(components, petID), "already revealed!");
    uint256 seed = uint256(blockhash(block.number - 1));
    LibRandom.removeRevealBlock(components, petID);
    return reveal(petID, seed);
  }

  function executeTyped(uint256 petIndex) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(petIndex));
  }

  // sets metadata with a random seed
  // second phase of commit/reveal scheme. pet owners call directly
  function reveal(uint256 petID, uint256 seed) internal returns (bytes memory) {
    // generates array of traits with weighted random
    uint256[] memory traits = LibERC721.genRandTraits(components, petID, seed);

    // setting metadata
    LibERC721.assignTraits(components, petID, traits);
    uint256 packed = LibRandom.packArray(traits, 8); // uses packed array to generate image off-chain
    // string memory _baseURI = LibConfig.getValueStringOf(components, "baseURI");
    LibPet.reveal(components, petID, LibString.concat(_baseURI, LibString.toString(packed)));
    return "";
  }

  /*********************
   *  CONFIG FUNCTIONS
   **********************/

  function _setBaseURI(string memory baseURI) public onlyOwner {
    _baseURI = baseURI;
  }
}
