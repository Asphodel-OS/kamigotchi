// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibData } from "libraries/LibData.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibItem } from "libraries/LibItem.sol";

uint256 constant ID = uint256(keccak256("system.item.burn"));

/// @notice a system that burns items from inventory - burnt items are lost forever, with no use effects
/// @dev used for quest ITEM_GIVE stuffs
contract ItemBurnSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint32[] memory indices, uint256[] memory amts) = abi.decode(arguments, (uint32[], uint256[]));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // checks
    LibItem.verifyBurnable(components, indices);

    // burning
    LibInventory.decForBatch(components, accID, indices, amts); // implicit inventory balance check

    // standard logging and tracking
    LibData.inc(components, accID, indices, "ITEM_BURN", amts);
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(
    uint32[] memory indices,
    uint256[] memory amts
  ) public returns (bytes memory) {
    return execute(abi.encode(indices, amts));
  }
}
