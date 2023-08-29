// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibTrade } from "libraries/LibTrade.sol";

uint256 constant ID = uint256(keccak256("system.Trade.Initiate"));

// TradeInitiateSystem allows an account to initiate a trade with another account, by request
contract TradeInitiateSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 toID = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    // requirements
    require(accountID != 0, "TradeInitiate: no account");
    require(accountID != toID, "Trade: no self-trade !!");
    require(LibTrade.canTrade(components, accountID, toID), "Trade: must be in same room");
    require(LibTrade.getRequest(components, accountID, toID) == 0, "Trade: request exists");

    uint256 tradeID = LibTrade.create(world, components, accountID, toID);
    LibAccount.updateLastBlock(components, accountID);
    return abi.encode(tradeID);
  }

  function executeTyped(uint256 toID) public returns (bytes memory) {
    return execute(abi.encode(toID));
  }
}
