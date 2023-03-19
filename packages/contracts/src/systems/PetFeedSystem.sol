// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";

uint256 constant ID = uint256(keccak256("system.Pet.Feed"));

// eat one snack
contract PetFeedSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint256 petID, uint256 foodIndex) = abi.decode(arguments, (uint256, uint256));
    uint256 accountID = LibAccount.getByAddress(components, msg.sender);
    // uint itemIndex = LibRegistryItem.getByFoodIndex(components, foodIndex);
    uint256 inventoryID = LibInventory.get(components, accountID, foodIndex);

    require(LibPet.getAccount(components, petID) == accountID, "Pet: not urs");
    require(inventoryID != 0, "Inventory: no food");

    LibInventory.dec(components, inventoryID, 1); // inherent check for insufficient balance
    LibPet.feed(components, petID, foodIndex);
    return "";
  }

  function executeTyped(uint256 petID, uint256 foodIndex) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(petID, foodIndex));
  }
}
