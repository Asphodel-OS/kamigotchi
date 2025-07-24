// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibTrade } from "libraries/LibTrade.sol";

uint256 constant ID = uint256(keccak256("system.trade.create"));

contract TradeCreateSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (
      uint32[] memory buyIndices,
      uint256[] memory buyAmts,
      uint32[] memory sellIndices,
      uint256[] memory sellAmts,
      uint256 targetID
    ) = abi.decode(arguments, (uint32[], uint256[], uint32[], uint256[], uint256));

    uint256 accID = LibAccount.getByOwner(components, msg.sender);
    LibTrade.verifyTradable(components, buyIndices, sellIndices);
    LibTrade.verifyMaxOrders(components, accID);

    // create the Trade
    LibTrade.processCreateFee(components, accID);
    LibTrade.processDeliveryFee(components, accID);
    uint256 id = LibTrade.create(
      world,
      components,
      accID,
      targetID,
      LibTrade.Order(buyIndices, buyAmts),
      LibTrade.Order(sellIndices, sellAmts)
    );

    // data logging and event emission
    LibTrade.emitTradeCreate(
      world,
      id,
      accID,
      targetID,
      LibTrade.Order(buyIndices, buyAmts),
      LibTrade.Order(sellIndices, sellAmts)
    );
    LibTrade.logCreate(components, accID);
    LibAccount.updateLastTs(components, accID);

    return abi.encode(id);
  }

  /// @param buyIndices Item indices to buy
  /// @param buyAmts Amounts to buy
  /// @param sellIndices Item indices to sell
  /// @param sellAmts Amounts to sell
  /// @param targetID Target Taker Account id
  function executeTyped(
    uint32[] memory buyIndices,
    uint256[] memory buyAmts,
    uint32[] memory sellIndices,
    uint256[] memory sellAmts,
    uint256 targetID
  ) public returns (bytes memory) {
    return execute(abi.encode(buyIndices, buyAmts, sellIndices, sellAmts, targetID));
  }
}
