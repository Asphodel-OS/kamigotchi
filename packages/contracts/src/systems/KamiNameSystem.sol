// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibKami } from "libraries/LibKami.sol";

uint256 constant ID = uint256(keccak256("system.kami.name"));
uint32 constant ROOM = 11;

// name pet
contract KamiNameSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 id, string memory name) = abi.decode(arguments, (uint256, string));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    LibKami.assertAccount(components, id, accID);
    require(LibKami.getRoom(components, id) == ROOM, "PetName: must be in room 11");
    require(bytes(name).length > 0, "PetName: name cannot be empty");
    require(bytes(name).length <= 16, "PetName: name can be at most 16 characters");
    require(LibKami.getByName(components, name) == 0, "PetName: name taken");

    // checks and sets nameability
    require(LibKami.useNameable(components, id), "PetName: cannot be named");

    LibKami.setName(components, id, name);

    // standard logging and tracking
    LibKami.logNameChange(components, accID);
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(uint256 id, string memory name) public returns (bytes memory) {
    return execute(abi.encode(id, name));
  }
}
