// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { System } from "solecs/System.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibKami721 } from "libraries/LibKami721.sol";

uint256 constant ID = uint256(keccak256("system.Kami721.Metadata"));

/// @title  System that handles metadata for Kami721
/// @dev    does not implement execute, only views tokenURI
/// @dev    URI is structured in a system to allow for upgradibility
contract Kami721MetadataSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  /// @param  petIndex  the ERC721 index of the pet
  /// @return pet metadata string
  function tokenURI(uint256 petIndex) public view returns (string memory) {
    return LibKami721.getJsonBase64(components, uint32(petIndex));
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "Kami721MetadataSystem: no execute");
  }

  function executeTyped() public returns (bytes memory) {
    require(false, "Kami721MetadataSystem: no execute");
  }
}
