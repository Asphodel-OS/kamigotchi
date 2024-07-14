// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { PlayerSystem } from "systems/base/PlayerSystem.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibTrade } from "libraries/LibTrade.sol";

uint256 constant ID = uint256(keccak256("system.Trade.Cancel"));

// TradeCancelSystem allows an account to cancel a trade they're currently involved in
contract TradeCancelSystem is PlayerSystem {
  constructor(IWorld _world, address _components) PlayerSystem(_world, _components) {}

  function execute(bytes memory arguments) public notPaused returns (bytes memory) {
    uint256 tradeID = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    // requirements
    // TODO: add same room check once disabling of room switching enforced on FE
    require(LibTrade.isTrade(components, tradeID), "Trade: not a trade");
    require(LibTrade.hasParticipant(components, tradeID, accountID), "Trade: must be participant");
    require(!LibTrade.hasState(components, tradeID, "CANCELED"), "Trade: already canceled");
    require(!LibTrade.hasState(components, tradeID, "COMPLETE"), "Trade: already complete");

    LibTrade.cancel(components, tradeID);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(uint256 tradeID) public notPaused returns (bytes memory) {
    return execute(abi.encode(tradeID));
  }
}
