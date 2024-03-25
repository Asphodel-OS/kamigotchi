// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibPet721 } from "libraries/LibPet721.sol";
import { LibSkill } from "libraries/LibSkill.sol";

uint256 constant ID = uint256(keccak256("system.Pet.Level"));

// level a pet up
contract PetLevelSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    // standard checks (type check, ownership, roomIndex)
    require(LibPet.isPet(components, id), "PetLevel: not a pet");
    require(LibPet.getAccount(components, id) == accountID, "PetLevel: not urs");
    require(
      LibPet.getRoom(components, id) == LibAccount.getRoom(components, accountID),
      "PetLevel: must be in same room"
    );

    // check that the pet meets the experience requirement
    uint256 levelCost = LibExperience.calcLevelCost(components, id);
    require(LibExperience.get(components, id) >= levelCost, "PetLevel: need more experience");

    // sync pet health
    LibPet.sync(components, id);

    // consume experience, level pet up and increase its SP
    LibExperience.dec(components, id, levelCost);
    LibExperience.incLevel(components, id, 1);
    LibSkill.inc(components, id, 1);

    // signal a metadata update
    LibPet721.updateEvent(world, LibPet.getIndex(components, id));

    // standard logging and tracking
    LibExperience.logPetLevelInc(components, accountID);
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
