// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { System } from "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibPet721 } from "libraries/LibPet721.sol";

uint256 constant ID = uint256(keccak256("system.Pet721.Metadata"));

// this system does not execute any code, only returns metadata for Pet721
contract Pet721MetadataSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  /*********************
   *  METADATA ASSEMBLER
   **********************/

  function tokenURI(uint256 petIndex) public view returns (string memory) {
    return LibPet721.getJsonBase64(components, petIndex);
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "Pet721MetadataSystem: no execute");
  }

  // accepts erc721 petIndex as input
  function executeTyped() public returns (bytes memory) {
    require(false, "Pet721MetadataSystem: no execute");
  }
}
