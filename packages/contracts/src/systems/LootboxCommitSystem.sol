// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibData } from "libraries/LibData.sol";
import { LibDroptable } from "libraries/LibDroptable.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibItem } from "libraries/LibItem.sol";

uint256 constant ID = uint256(keccak256("system.lootbox.commit"));

// @notice start the reveal process for a lootbox
contract LootboxCommitSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint32 index, uint256 amt) = abi.decode(arguments, (uint32, uint256));

    // checks
    uint256 accID = LibAccount.getByOperator(components, msg.sender);
    LibItem.verifyType(components, index, "LOOTBOX");
    if (amt > 10) revert("max 10 reveal at once");

    // decrease and commit
    LibInventory.decFor(components, accID, index, amt); // implicit balance check
    uint256 revealID = LibItem.droptableCommit(world, components, index, amt, accID);

    // standard logging and tracking
    LibData.inc(components, accID, index, "LOOTBOX_OPENED", amt);
    LibAccount.updateLastTs(components, accID);

    return abi.encode(revealID);
  }

  function executeTyped(uint32 index, uint256 amt) public returns (bytes memory) {
    return execute(abi.encode(index, amt));
  }
}
