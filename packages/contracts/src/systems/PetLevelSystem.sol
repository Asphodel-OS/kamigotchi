// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibPet721 } from "libraries/LibPet721.sol";

uint256 constant ID = uint256(keccak256("system.Pet.Level"));

// level a pet up
contract PetLevelSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    // standard checks (type check, ownership, location)
    require(LibPet.isPet(components, id), "PetLevel: not a pet");
    require(LibPet.getAccount(components, id) == accountID, "PetLevel: not urs");
    require(
      LibPet.getLocation(components, id) == LibAccount.getLocation(components, accountID),
      "PetLevel: must be in same room"
    );

    // check that the pet meets the experience requirement
    uint256 levelCost = LibExperience.calcLevelCost(components, id);
    require(LibExperience.get(components, id) >= levelCost, "PetLevel: need more experience");

    // level the pet up and heal it to full
    LibExperience.dec(components, id, levelCost);
    LibExperience.incLevel(components, id, 1);
    LibPet.heal(components, id, LibPet.calcTotalHealth(components, id));

    // signal a metadata update
    LibPet721.updateEvent(world, LibPet.idToIndex(components, id));

    LibAccount.updateLastBlock(components, accountID);
    return "";
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
