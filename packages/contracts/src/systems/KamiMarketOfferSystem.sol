// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibKamiMarket } from "libraries/LibKamiMarket.sol";

uint256 constant ID = uint256(keccak256("system.kamimarket.offer"));

/// @notice Create specific or collection offer (WETH approval-based, no escrow)
contract KamiMarketOfferSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    // decode: isCollection flag, kamiIndex (0 for collection), price, quantity (1 for specific), expiry
    (bool isCollection, uint32 kamiIndex, uint256 price, uint32 quantity, uint256 expiry) = abi.decode(
      arguments,
      (bool, uint32, uint256, uint32, uint256)
    );

    uint256 accID = uint256(uint160(msg.sender));
    LibKamiMarket.verifyEnabled(components);
    LibKamiMarket.verifyMaxOrders(components, accID);
    require(price > 0, "KamiMarketOffer: price must be > 0");

    uint256 id;
    uint32 eventKamiIndex;
    uint32 eventQuantity;
    if (isCollection) {
      require(quantity > 0 && quantity <= uint32(type(int32).max), "KamiMarketOffer: invalid quantity");
      id = LibKamiMarket.createCollectionOffer(world, components, accID, price, quantity, expiry);
      eventKamiIndex = 0;
      eventQuantity = quantity;
    } else {
      // verify target kami exists
      require(LibKami.getByIndex(components, kamiIndex) != 0, "KamiMarketOffer: kami not found");
      id = LibKamiMarket.createOffer(world, components, accID, kamiIndex, price, expiry);
      eventKamiIndex = kamiIndex;
      eventQuantity = 1;
    }

    // data logging and event emission
    LibKamiMarket.emitOffer(world, id, accID, eventKamiIndex, eventQuantity, price, expiry);
    LibKamiMarket.logOffer(components, accID);
    if (LibAccount.isAccount(components, accID)) {
      LibAccount.updateLastTs(components, accID);
    }

    return abi.encode(id);
  }

  /// @notice Create a specific offer for a kami
  function executeTypedOffer(uint32 kamiIndex, uint256 price, uint256 expiry) public returns (bytes memory) {
    return execute(abi.encode(false, kamiIndex, price, uint32(1), expiry));
  }

  /// @notice Create a collection offer
  function executeTypedCollection(uint256 price, uint32 quantity, uint256 expiry) public returns (bytes memory) {
    return execute(abi.encode(true, uint32(0), price, quantity, expiry));
  }
}
