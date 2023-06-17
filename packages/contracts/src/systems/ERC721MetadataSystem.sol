// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { System } from "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibERC721 } from "libraries/LibERC721.sol";

uint256 constant ID = uint256(keccak256("system.ERC721.Metadata"));

// this system does not execute any code, only returns metadata for KamiERC721
contract ERC721MetadataSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  /*********************
   *  METADATA ASSEMBLER
   **********************/

  function tokenURI(uint256 petIndex) public view returns (string memory) {
    return LibERC721.getJsonBase64(components, petIndex);
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "ERC721MetadataSystem: no execute");
  }

  // accepts erc721 petIndex as input
  function executeTyped() public returns (bytes memory) {
    require(false, "ERC721MetadataSystem: no execute");
  }
}
