// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibItem } from "libraries/LibItem.sol";

uint256 constant ID = uint256(keccak256("system.account.use.item"));

// eat one snack
contract AccountUseItemSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint32 itemIndex, uint256 amt) = abi.decode(arguments, (uint32, uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // item checks
    LibItem.verifyMaxPerUse(components, amt);
    LibItem.verifyForShape(components, itemIndex, "ACCOUNT");
    LibItem.verifyRequirements(components, itemIndex, "USE", accID);

    // use items
    LibAccount.sync(components, accID);
    LibInventory.decFor(components, accID, itemIndex, amt); // implicit balance check
    LibItem.applyAllos(world, components, itemIndex, "USE", amt, accID);

    // standard logging and tracking
    LibItem.logUse(components, accID, itemIndex, amt, "ACCOUNT");
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(uint32 itemIndex, uint256 amt) public returns (bytes memory) {
    return execute(abi.encode(itemIndex, amt));
  }
}
