// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibTrade } from "libraries/LibTrade.sol";

uint256 constant ID = uint256(keccak256("system.trade.cancel"));

// TradeCancelSystem allows an account to cancel a trade they're currently involved in
contract TradeCancelSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 tradeID = abi.decode(arguments, (uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // requirements
    // TODO: add same room check once disabling of room switching enforced on FE
    require(LibTrade.isTrade(components, tradeID), "Trade: not a trade");
    require(LibTrade.hasParticipant(components, tradeID, accID), "Trade: must be participant");
    require(!LibTrade.hasState(components, tradeID, "CANCELED"), "Trade: already canceled");
    require(!LibTrade.hasState(components, tradeID, "COMPLETE"), "Trade: already complete");

    LibTrade.cancel(components, tradeID);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(uint256 tradeID) public returns (bytes memory) {
    return execute(abi.encode(tradeID));
  }
}
