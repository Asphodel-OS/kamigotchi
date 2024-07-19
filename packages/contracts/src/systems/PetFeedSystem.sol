// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibData } from "libraries/LibData.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibHarvest } from "libraries/LibHarvest.sol";
import { LibItemRegistry } from "libraries/LibItemRegistry.sol";
import { LibStat } from "libraries/LibStat.sol";
import { LibScore } from "libraries/LibScore.sol";

uint256 constant ID = uint256(keccak256("system.Pet.Feed"));

// eat one snack
contract PetFeedSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 id, uint32 itemIndex) = abi.decode(arguments, (uint256, uint32));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // check whether the specified item is consumable
    require(LibItemRegistry.isConsumable(components, itemIndex), "PetFeed: that's not food");
    require(LibItemRegistry.isForPet(components, itemIndex), "PetFeed: that's not for pets");

    // standard checks (ownership, state, roomIndex)
    require(LibPet.isPet(components, id), "PetFeed: not a pet");
    require(LibPet.getAccount(components, id) == accID, "PetFeed: pet not urs");
    require(!LibPet.onCooldown(components, id), "PetFeed: pet on cooldown");
    require(
      LibPet.getRoom(components, id) == LibAccount.getRoom(components, accID),
      "PetFeed: pet too far"
    );

    // item specific checks
    if (LibItemRegistry.isRevive(components, itemIndex)) {
      require(LibPet.isDead(components, id), "PetFeed: pet already alive");
    } else {
      require(
        LibPet.isResting(components, id) || LibPet.isHarvesting(components, id),
        "PetFeed: pet must be alive"
      );
    }

    // process the feeding (sync pet, dec inventory, apply effects)
    LibPet.sync(components, id);
    LibInventory.decFor(components, accID, itemIndex, 1); // implicit balance check
    LibPet.feed(components, id, itemIndex);

    // reset the pet's intensity
    if (LibPet.isHarvesting(components, id)) {
      uint256 productionID = LibPet.getProduction(components, id);
      LibHarvest.resetIntensity(components, productionID);
    }

    // standard logging and tracking
    LibScore.incFor(components, accID, "FEED", 1);
    LibData.inc(components, accID, 0, "PET_FEED", 1);
    LibData.inc(components, accID, itemIndex, "INV_USE", 1);
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(uint256 id, uint32 itemIndex) public returns (bytes memory) {
    return execute(abi.encode(id, itemIndex));
  }
}
