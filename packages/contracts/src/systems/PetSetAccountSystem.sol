// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

import { LibPet } from "libraries/LibPet.sol";

uint256 constant ID = uint256(keccak256("system.Pet.SetAccount"));

// NOTE: this may not be the ideal flow for setting accounts. likely, we'll instead
// want to update the owner on transfer and just clear out the account
contract PetSetAccountSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 entityID, address to) = abi.decode(arguments, (uint256, address));

    require(LibPet.getOwner(components, entityID) == addressToEntity(msg.sender), "Pet: not urs");

    LibPet.setAccount(components, entityID, addressToEntity(to));

    return abi.encode(to);
  }

  function executeTyped(uint256 entityID, address to) public returns (bytes memory) {
    return execute(abi.encode(entityID, to));
  }
}
