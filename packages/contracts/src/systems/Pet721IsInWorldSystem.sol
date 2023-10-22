// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibPet } from "libraries/LibPet.sol";

uint256 constant ID = uint256(keccak256("system.Pet721.IsInWorld"));

/// @notice a view check to check if pet is in world. Used to allow upgradibiliy
contract Pet721IsInWorldSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  /// @notice checks if pet is in world
  /// @param  petIndex  the ERC721 index of the pet
  function isInWorld(uint256 petIndex) public view returns (bool) {
    uint256 entityID = LibPet.indexToID(components, petIndex);
    return LibPet.isInWorld(components, entityID);
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "Pet721IsInWorld: no execute");
  }

  function executeTyped() public returns (bytes memory) {
    require(false, "Pet721IsInWorld: no execute");
  }
}
