// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibInventory, GACHA_TICKET_INDEX } from "libraries/LibInventory.sol";
import { LibGacha } from "libraries/LibGacha.sol";
import { LibKamiCreate } from "libraries/LibKamiCreate.sol";

uint256 constant ID = uint256(keccak256("system.kami.gacha.mint"));

/// @notice commits to get a random pet from gacha using a Gacha Ticket
/// @dev this acts as a replacement for a traditional reveal
contract KamiGachaMintSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 amount = abi.decode(arguments, (uint256));
    require(amount <= 1, "too many mints"); // force 1 mint per tx at launch to reduce congestion
    require(
      LibConfig.get(components, "MINT_START_PUBLIC") + 1 hours < block.timestamp,
      "public mint has not yet started"
    ); // launch: enforce 1h after public mint start

    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    // use gacha tickets balance
    LibInventory.decFor(components, accID, GACHA_TICKET_INDEX, amount);

    // commits random seed for gacha roll
    uint256[] memory results = LibGacha.commit(world, components, amount, accID, block.number);
    LibKamiCreate.create(components, amount); // create new kamis into pool

    // standard logging and tracking
    LibGacha.logMint(components, accID, amount);
    LibAccount.updateLastTs(components, accID);
    return abi.encode(results);
  }

  function executeTyped(uint256 amount) public returns (bytes memory) {
    return execute(abi.encode(amount));
  }
}
