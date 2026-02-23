// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibKamiMarket } from "libraries/LibKamiMarket.sol";
import { LibSoulbound } from "libraries/LibSoulbound.sol";

uint256 constant ID = uint256(keccak256("system.kamimarket.list"));

/// @notice Create a listing — mark kami as LISTED, seller keeps it in wallet
contract KamiMarketListSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint32 kamiIndex, uint256 price, uint256 expiry) = abi.decode(arguments, (uint32, uint256, uint256));

    uint256 accID = LibAccount.verifyOperator(components);
    LibKamiMarket.verifyEnabled(components);
    LibKamiMarket.verifyKamiResting(components, kamiIndex, accID);
    require(price > 0, "KamiMarketList: price must be > 0");

    // mark kami as listed (no escrow — kami stays in seller's wallet)
    // "LISTED" state prevents bridge-in via isInWorld() check
    uint256 kamiID = LibKami.getByIndex(components, kamiIndex);
    LibSoulbound.verify(components, kamiID);
    LibKami.setState(components, kamiID, "LISTED");

    // create listing entity
    uint256 id = LibKamiMarket.createListing(world, components, accID, kamiIndex, price, expiry);

    // data logging and event emission
    LibKamiMarket.emitList(world, id, accID, kamiIndex, price, expiry);
    LibKamiMarket.logList(components, accID);
    LibAccount.updateLastTs(components, accID);

    return abi.encode(id);
  }

  /// @param kamiIndex Kami token index to list
  /// @param price Listing price in wei (ETH)
  /// @param expiry Expiry timestamp (0 = never)
  function executeTyped(uint32 kamiIndex, uint256 price, uint256 expiry) public returns (bytes memory) {
    return execute(abi.encode(kamiIndex, price, expiry));
  }
}
