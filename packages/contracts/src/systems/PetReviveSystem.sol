// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";
import { LibStat } from "libraries/LibStat.sol";

uint256 constant ID = uint256(keccak256("system.Pet.Revive"));

// eat one snack
contract PetReviveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 id, uint256 reviveIndex) = abi.decode(arguments, (uint256, uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    // standard checks (ownership, cooldown, state)
    require(accountID != 0, "PetRevive: no account");
    require(LibPet.getAccount(components, id) == accountID, "Pet: not urs");
    require(LibPet.canAct(components, id), "Pet: on cooldown");
    require(LibPet.isDead(components, id), "Pet: must be dead");

    // find the registry entry
    uint256 registryID = LibRegistryItem.getByReviveIndex(components, reviveIndex);
    require(registryID != 0, "RegistryItem: no such revive");

    // decrement item from inventory
    uint256 itemIndex = LibRegistryItem.getItemIndex(components, registryID);
    uint256 inventoryID = LibInventory.get(components, accountID, itemIndex);
    LibInventory.dec(components, inventoryID, 1); // implicit check for insufficient balance

    // revive and heal according to item stats
    uint256 healAmt = LibStat.getHealth(components, registryID);
    LibPet.revive(components, id);
    LibPet.heal(components, id, healAmt);
    LibPet.setLastTs(components, id, block.timestamp); // explicitly, as we don't sync health on this EP

    // update account info
    LibDataEntity.incFor(world, components, accountID, itemIndex, "INV_USE", 1);
    LibAccount.updateLastBlock(components, accountID);
    return "";
  }

  function executeTyped(uint256 id, uint256 reviveIndex) public returns (bytes memory) {
    return execute(abi.encode(id, reviveIndex));
  }
}
