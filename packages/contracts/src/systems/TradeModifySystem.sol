// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibTrade } from "libraries/LibTrade.sol";

uint256 constant ID = uint256(keccak256("system.trade.modify"));

contract TradeModifySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (
      uint256 tradeID,
      uint32[] memory buyIndices,
      uint256[] memory buyAmts,
      uint32[] memory sellIndices,
      uint256[] memory sellAmts,
      uint256 targetID
    ) = abi.decode(arguments, (uint256, uint32[], uint256[], uint32[], uint256[], uint256));

    uint256 accID = LibAccount.getByOperator(components, msg.sender);
    LibTrade.verifyTradable(components, buyIndices, sellIndices);
    LibTrade.verifySeller(components, tradeID, accID);

    // modify trade order
    LibTrade.modify(
      components,
      tradeID,
      targetID,
      LibTrade.Order(buyIndices, buyAmts),
      LibTrade.Order(sellIndices, sellAmts)
    );

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(
    uint256 tradeID,
    uint32[] memory buyIndices,
    uint256[] memory buyAmts,
    uint32[] memory sellIndices,
    uint256[] memory sellAmts,
    uint256 targetID
  ) public returns (bytes memory) {
    return execute(abi.encode(tradeID, buyIndices, buyAmts, sellIndices, sellAmts, targetID));
  }
}
