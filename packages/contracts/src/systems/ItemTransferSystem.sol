// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibInventory } from "libraries/LibInventory.sol";

uint256 constant ID = uint256(keccak256("system.item.transfer"));

contract ItemTransferSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint32[] memory indices, uint256[] memory amts, uint256 targetID) = abi.decode(
      arguments,
      (uint32[], uint256[], uint256)
    );

    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    // checks
    require(indices.length == amts.length, "ItemTransfer: arrays length mismatch");
    LibInventory.verifyTransferable(components, indices);

    // transfer
    LibInventory.transferFor(components, accID, targetID, indices, amts);

    // data logging and event emission
    LibInventory.logTransfer(world, components, accID, targetID, indices, amts);
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(
    uint32[] memory indices,
    uint256[] memory amts,
    uint256 targetID
  ) public returns (bytes memory) {
    return execute(abi.encode(indices, amts, targetID));
  }
}
