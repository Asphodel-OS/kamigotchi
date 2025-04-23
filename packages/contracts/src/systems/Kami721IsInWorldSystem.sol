// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibKami } from "libraries/LibKami.sol";

uint256 constant ID = uint256(keccak256("system.Kami721.IsInWorld"));

/// @notice a view check to check if pet is in world. Used to allow upgradibiliy
contract Kami721IsInWorldSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  /// @notice checks if pet is in world
  /// @param  petIndex  the ERC721 index of the pet
  function isInWorld(uint256 petIndex) public view returns (bool) {
    uint256 entityID = LibKami.getByIndex(components, uint32(petIndex));
    return LibKami.isInWorld(components, entityID);
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "Kami721IsInWorld: no execute");
  }

  function executeTyped() public returns (bytes memory) {
    require(false, "Kami721IsInWorld: no execute");
  }
}
