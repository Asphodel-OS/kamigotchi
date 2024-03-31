// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibExperience } from "libraries/LibExperience.sol";
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
    (uint256 id, uint32 itemIndex) = abi.decode(arguments, (uint256, uint32));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    // get/check registry entry
    uint256 registryID = LibRegistryItem.getByIndex(components, itemIndex);
    string memory type_ = LibRegistryItem.getType(components, registryID);
    require(LibString.eq(type_, "FOOD"), "PetFeed: that's not food");

    // standard checks (ownership, state, roomIndex)
    require(LibPet.isPet(components, id), "PetFeed: not a pet");
    require(LibPet.getAccount(components, id) == accountID, "PetFeed: pet not urs");
    require(!LibPet.onCooldown(components, id), "PetFeed: pet on cooldown");
    require(
      LibPet.isResting(components, id) || LibPet.isHarvesting(components, id),
      "PetFeed: pet must be resting|harvesting"
    );
    require(
      LibPet.getRoom(components, id) == LibAccount.getRoom(components, accountID),
      "PetFeed: pet must be in same room"
    );

    // sync
    LibPet.sync(components, id);

    // decrement item from inventory
    uint256 inventoryID = LibInventory.get(components, accountID, itemIndex);
    LibInventory.dec(components, inventoryID, 1); // implicit check for insufficient balance

    // execute feeding actions
    LibPet.heal(components, id, LibStat.getHealth(components, registryID).sync);
    LibExperience.inc(components, id, LibExperience.get(components, registryID));

    // standard logging and tracking
    LibScore.inc(components, accountID, "FEED", 1);
    LibDataEntity.inc(components, accountID, itemIndex, "INV_USE", 1);
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(uint256 id, uint32 itemIndex) public returns (bytes memory) {
    return execute(abi.encode(id, itemIndex));
  }
}
