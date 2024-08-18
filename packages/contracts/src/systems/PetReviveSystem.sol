// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibData } from "libraries/LibData.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibItemRegistry } from "libraries/LibItemRegistry.sol";
import { LibStat } from "libraries/LibStat.sol";

uint256 constant ID = uint256(keccak256("system.Pet.Revive"));

// eat one snack
contract PetReviveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 id, uint32 itemIndex) = abi.decode(arguments, (uint256, uint32));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // get/check registry entry
    uint256 registryID = LibItemRegistry.getByIndex(components, itemIndex);
    string memory type_ = LibItemRegistry.getType(components, registryID);
    require(LibString.eq(type_, "REVIVE"), "PetRevive: god can't save you");

    // standard checks (ownership, cooldown, state)
    require(LibPet.getAccount(components, id) == accID, "PetRevive: pet not urs");
    require(LibPet.isDead(components, id), "PetRevive: pet not dead");

    // decrement item from inventory with implicit check for insufficient balance
    LibInventory.decFor(components, accID, itemIndex, 1);

    // revive and heal according to item stats
    LibPet.revive(components, id);
    LibPet.heal(components, id, LibStat.getHealth(components, registryID).sync);
    LibPet.setLastTs(components, id, block.timestamp); // explicitly, as we don't sync health on this EP

    // standard logging and tracking
    LibPet.logRevive(components, id);
    LibData.inc(components, accID, itemIndex, "ITEM_USE", 1);
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(uint256 id, uint32 itemIndex) public returns (bytes memory) {
    return execute(abi.encode(id, itemIndex));
  }
}
