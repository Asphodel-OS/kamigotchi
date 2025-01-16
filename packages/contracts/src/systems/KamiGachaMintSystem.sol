// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibInventory, GACHA_TICKET_INDEX } from "libraries/LibInventory.sol";
import { LibGacha } from "libraries/LibGacha.sol";

uint256 constant ID = uint256(keccak256("system.kami.gacha.mint"));

/// @notice commits to get a random pet from gacha using a Gacha Ticket
/// @dev this acts as a replacement for a traditional reveal
contract KamiGachaMintSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 amount = abi.decode(arguments, (uint256));

    uint256 accID = LibAccount.getByOwner(components, msg.sender);
    if (accID == 0) revert("no account detected");

    // use gacha inventory balance
    LibInventory.decFor(components, accID, GACHA_TICKET_INDEX, amount);

    // commits random seed for gacha roll
    uint256[] memory results = LibGacha.commitBatch(world, components, amount, accID, block.number);

    // standard logging and tracking
    LibGacha.logMint(components, accID, amount);
    LibAccount.updateLastTs(components, accID);
    return abi.encode(results);
  }

  function executeTyped(uint256 amount) public returns (bytes memory) {
    return execute(abi.encode(amount));
  }
}
