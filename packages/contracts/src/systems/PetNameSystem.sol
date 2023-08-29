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
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    require(accountID != 0, "PetName: no account");
    require(LibPet.isPet(components, id), "PetName: not a pet");
    require(LibPet.canName(components, id), "PetName: cannot named");
    require(LibPet.getAccount(components, id) == accountID, "PetName: not urs");
    require(LibPet.getLocation(components, id) == ROOM, "PetName: must be in room 11");
    require(bytes(name).length > 0, "PetName: name cannot be empty");
    require(bytes(name).length <= 16, "PetName: name can be at most 16 characters");
    require(LibPet.getByName(components, name) == 0, "PetName: name taken");

    LibPet.setName(components, id, name);
    LibPet.setCanName(components, id, false);
    LibAccount.updateLastBlock(components, accountID);
    return "";
  }

  function executeTyped(uint256 id, string memory name) public returns (bytes memory) {
    return execute(abi.encode(id, name));
  }
}
