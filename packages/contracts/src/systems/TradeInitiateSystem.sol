// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibTrade } from "libraries/LibTrade.sol";

uint256 constant ID = uint256(keccak256("system.trade.initiate"));

// TradeInitiateSystem allows an account to initiate a trade with another account, by request
contract TradeInitiateSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 toID = abi.decode(arguments, (uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // requirements
    require(accID != toID, "Trade: no self-trade !!");
    require(LibTrade.canTrade(components, accID, toID), "Trade: must be in same room");
    require(LibTrade.getRequest(components, accID, toID) == 0, "Trade: request exists");

    uint256 tradeID = LibTrade.create(world, components, accID, toID);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    return abi.encode(tradeID);
  }

  function executeTyped(uint256 toID) public returns (bytes memory) {
    return execute(abi.encode(toID));
  }
}
