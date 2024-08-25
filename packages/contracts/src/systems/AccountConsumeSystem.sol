// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibData } from "libraries/LibData.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibItemRegistry } from "libraries/LibItemRegistry.sol";

import { getAddressById, getComponentById } from "solecs/utils.sol";
import { IndexRoomComponent, ID as RoomCompID } from "components/IndexRoomComponent.sol";

uint256 constant ID = uint256(keccak256("system.Account.Consume"));

// eat one snack
contract AccountConsumeSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint32 itemIndex = abi.decode(arguments, (uint32));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // check whether the specified item is consumable
    require(LibItemRegistry.isConsumable(components, itemIndex), "AccountConsume: item not edible");
    require(LibItemRegistry.isForAccount(components, itemIndex), "AccountConsume: beneath you");

    LibAccount.syncStamina(components, accID);
    LibInventory.decFor(components, accID, itemIndex, 1); // implicit balance check

    if (itemIndex == 119) {
      // hardcode mina teleport scroll - to actually implement soon
      IndexRoomComponent(getAddressById(components, RoomCompID)).set(accID, 13);
    } else LibAccount.consume(components, accID, itemIndex);

    // standard logging and tracking
    LibData.inc(components, accID, itemIndex, "ITEM_USE", 1);
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(uint32 itemIndex) public returns (bytes memory) {
    return execute(abi.encode(itemIndex));
  }
}
