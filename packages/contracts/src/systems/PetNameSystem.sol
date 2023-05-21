// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibPet } from "libraries/LibPet.sol";

uint256 constant ID = uint256(keccak256("system.Pet.Name"));

uint256 constant ROOM = 11;

// name pet
contract PetNameSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 id, string memory name) = abi.decode(arguments, (uint256, string));
    uint256 accountID = LibAccount.getByAddress(components, msg.sender);

    require(LibPet.isPet(components, id), "Pet: not a pet");
    require(LibPet.canName(components, id), "Pet: cannot named");
    require(LibPet.getAccount(components, id) == accountID, "Pet: not urs");
    require(LibPet.getLocation(components, id) == ROOM, "Not in correct room");
    require(bytes(name).length > 0, "PET: name cannot be empty");
    require(bytes(name).length <= 16, "PET: name can be at most 16 characters");
    require(LibPet.getByName(components, name) == 0, "Pet: name taken");

    LibPet.setName(components, id, name);
    LibPet.removeCanName(components, id);
    LibAccount.updateLastBlock(components, accountID);
    return "";
  }

  function executeTyped(uint256 id, string memory name) public returns (bytes memory) {
    return execute(abi.encode(id, name));
  }
}
