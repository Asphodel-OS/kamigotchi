// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibItem } from "libraries/LibItem.sol";

uint256 constant ID = uint256(keccak256("system.account.use.teleport"));

// eat one snack
contract AccountUseTeleportSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint32 itemIndex = abi.decode(arguments, (uint32));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // item checks
    LibItem.verifyType(components, itemIndex, "TELEPORT");
    LibItem.verifyForAccount(components, itemIndex);

    // use items
    LibInventory.decFor(components, accID, itemIndex, 1); // implicit balance check
    LibItem.applyMove(components, itemIndex, accID);

    // standard logging and tracking
    LibItem.logUse(components, accID, itemIndex, 1);
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(uint32 itemIndex) public returns (bytes memory) {
    return execute(abi.encode(itemIndex));
  }
}
