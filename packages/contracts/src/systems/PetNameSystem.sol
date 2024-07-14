// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { PlayerSystem } from "systems/base/PlayerSystem.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibPet } from "libraries/LibPet.sol";

uint256 constant ID = uint256(keccak256("system.Pet.Name"));
uint32 constant ROOM = 11;

// name pet
contract PetNameSystem is PlayerSystem {
  constructor(IWorld _world, address _components) PlayerSystem(_world, _components) {}

  function execute(bytes memory arguments) public notPaused returns (bytes memory) {
    (uint256 id, string memory name) = abi.decode(arguments, (uint256, string));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    require(LibPet.isPet(components, id), "PetName: not a pet");
    require(LibPet.getAccount(components, id) == accountID, "PetName: not urs");
    require(LibPet.getRoom(components, id) == ROOM, "PetName: must be in room 11");
    require(bytes(name).length > 0, "PetName: name cannot be empty");
    require(bytes(name).length <= 16, "PetName: name can be at most 16 characters");
    require(LibPet.getByName(components, name) == 0, "PetName: name taken");

    // checks and sets nameability
    require(LibPet.useNameable(components, id), "PetName: cannot be named");

    LibPet.setName(components, id, name);

    // standard logging and tracking
    LibPet.logNameChange(components, accountID);
    LibAccount.updateLastTs(components, accountID);

    return "";
  }

  function executeTyped(uint256 id, string memory name) public notPaused returns (bytes memory) {
    return execute(abi.encode(id, name));
  }
}
