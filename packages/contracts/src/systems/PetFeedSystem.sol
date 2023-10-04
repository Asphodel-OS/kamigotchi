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
import { LibScore } from "libraries/LibScore.sol";

uint256 constant ID = uint256(keccak256("system.Pet.Feed"));

// eat one snack
contract PetFeedSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 id, uint256 foodIndex) = abi.decode(arguments, (uint256, uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    // standard checks (ownership, cooldown, state)
    require(accountID != 0, "PetFeed: no account");
    require(LibPet.isPet(components, id), "Pet: not a pet");
    require(LibPet.getAccount(components, id) == accountID, "Pet: not urs");
    require(LibPet.canAct(components, id), "Pet: on cooldown");
    require(
      LibPet.isResting(components, id) || LibPet.isHarvesting(components, id),
      "Pet: must be resting|harvesting"
    );

    // check pet is in same room as account
    require(
      LibPet.getLocation(components, id) == LibAccount.getLocation(components, accountID),
      "Pet: must be in same room"
    );

    // check pet is not full
    LibPet.syncHealth(components, id);
    require(!LibPet.isFull(components, id), "Pet: already full");

    // get food registry entry
    uint256 registryID = LibRegistryItem.getByFoodIndex(components, foodIndex);
    require(registryID != 0, "RegistryItem: no such food");

    // decrement item from inventory
    uint256 itemIndex = LibRegistryItem.getItemIndex(components, registryID);
    uint256 inventoryID = LibInventory.get(components, accountID, itemIndex);
    LibInventory.dec(components, inventoryID, 1); // implicit check for insufficient balance

    // heal according to item stats
    uint256 healAmt = LibStat.getHealth(components, registryID);
    LibPet.heal(components, id, healAmt);

    // updating account info
    LibScore.incBy(world, components, accountID, "FEED", 1);
    LibDataEntity.incFor(world, components, accountID, itemIndex, "INV_USE", 1);
    LibAccount.updateLastBlock(components, accountID);
    return "";
  }

  function executeTyped(uint256 id, uint256 foodIndex) public returns (bytes memory) {
    return execute(abi.encode(id, foodIndex));
  }
}
