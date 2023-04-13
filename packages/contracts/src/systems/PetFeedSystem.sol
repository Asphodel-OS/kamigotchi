// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";
import { LibStat } from "libraries/LibStat.sol";

uint256 constant ID = uint256(keccak256("system.Pet.Feed"));

// eat one snack
contract PetFeedSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 petID, uint256 foodIndex) = abi.decode(arguments, (uint256, uint256));
    uint256 accountID = LibAccount.getByAddress(components, msg.sender);

    require(LibPet.getAccount(components, petID) == accountID, "Pet: not urs");

    uint256 registryID = LibRegistryItem.getByFoodIndex(components, foodIndex);
    require(registryID != 0, "RegistryItem: no such food");

    require(LibPet.syncHealth(components, petID) != 0, "Pet: is dead (pls revive)");

    uint256 itemIndex = LibRegistryItem.getItemIndex(components, registryID);
    uint256 inventoryID = LibInventory.get(components, accountID, itemIndex);
    require(inventoryID != 0, "Inventory: no bitches, no food");

    LibInventory.dec(components, inventoryID, 1); // inherent check for insufficient balance

    uint256 healAmt = LibStat.getHealth(components, registryID);
    LibPet.heal(components, petID, healAmt);
    LibAccount.updateLastBlock(components, accountID); // gas limit :|
    return "";
  }

  function executeTyped(uint256 petID, uint256 foodIndex) public returns (bytes memory) {
    return execute(abi.encode(petID, foodIndex));
  }
}
