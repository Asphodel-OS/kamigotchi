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
import { LibHarvest } from "libraries/LibHarvest.sol";
import { LibItemRegistry } from "libraries/LibItemRegistry.sol";
import { LibStat } from "libraries/LibStat.sol";
import { LibScore } from "libraries/LibScore.sol";

uint256 constant ID = uint256(keccak256("system.Account.Consume"));

// eat one snack
contract AccountConsumeSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint32 itemIndex = abi.decode(arguments, (uint32));
    uint256 id = LibAccount.getByOperator(components, msg.sender);
    require(id != 0, "AccountConsume: no account");

    // check whether the specified item is consumable
    require(LibItemRegistry.isConsumable(components, itemIndex), "AccountConsume: item not edible");
    require(LibItemRegistry.isForAccount(components, itemIndex), "AccountConsume: beneath you");

    LibAccount.syncStamina(components, id);
    LibInventory.decFor(components, id, itemIndex, 1); // implicit balance check
    LibAccount.consume(components, id, itemIndex);

    // standard logging and tracking
    LibDataEntity.inc(components, id, itemIndex, "INV_USE", 1);
    LibAccount.updateLastTs(components, id);
    return "";
  }

  function executeTyped(uint32 itemIndex) public returns (bytes memory) {
    return execute(abi.encode(itemIndex));
  }
}
