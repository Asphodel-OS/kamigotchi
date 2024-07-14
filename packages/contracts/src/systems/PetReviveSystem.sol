// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { PlayerSystem } from "systems/base/PlayerSystem.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibItemRegistry } from "libraries/LibItemRegistry.sol";
import { LibStat } from "libraries/LibStat.sol";

uint256 constant ID = uint256(keccak256("system.Pet.Revive"));

// eat one snack
contract PetReviveSystem is PlayerSystem {
  constructor(IWorld _world, address _components) PlayerSystem(_world, _components) {}

  function execute(bytes memory arguments) public notPaused returns (bytes memory) {
    (uint256 id, uint32 itemIndex) = abi.decode(arguments, (uint256, uint32));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    // get/check registry entry
    uint256 registryID = LibItemRegistry.getByIndex(components, itemIndex);
    string memory type_ = LibItemRegistry.getType(components, registryID);
    require(LibString.eq(type_, "REVIVE"), "PetRevive: god can't save you");

    // standard checks (ownership, cooldown, state)
    require(LibPet.getAccount(components, id) == accountID, "PetRevive: pet not urs");
    require(LibPet.isDead(components, id), "PetRevive: pet not dead");

    // decrement item from inventory with implicit check for insufficient balance
    LibInventory.decFor(components, accountID, itemIndex, 1);

    // revive and heal according to item stats
    LibPet.revive(components, id);
    LibPet.heal(components, id, LibStat.getHealth(components, registryID).sync);
    LibPet.setLastTs(components, id, block.timestamp); // explicitly, as we don't sync health on this EP

    // standard logging and tracking
    LibPet.logRevive(components, id);
    LibDataEntity.inc(components, accountID, itemIndex, "INV_USE", 1);
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(uint256 id, uint32 itemIndex) public notPaused returns (bytes memory) {
    return execute(abi.encode(id, itemIndex));
  }
}
