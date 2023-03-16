// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibTrade } from "libraries/LibTrade.sol";
import { Utils } from "utils/Utils.sol";

uint256 constant ID = uint256(keccak256("system.TradeAccept"));

// TradeAcceptSystem allows an account to accept a trade request by another account
contract TradeAcceptSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 tradeID = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByAddress(components, msg.sender);

    // requirements
    // TODO: add same room check once disabling of room switching enforced on FE
    // TODO: ? add restriction against multiple ongoing trades
    require(Utils.isTrade(components, tradeID), "Trade: not a trade");
    require(Utils.isRequest(components, tradeID), "Trade: not a request");
    require(LibTrade.getRequestee(components, tradeID) == accountID, "Trade: must be requestee");

    LibTrade.accept(world, components, tradeID);
    Utils.updateLastBlock(components, accountID);
    return "";
  }

  function executeTyped(uint256 tradeID) public returns (bytes memory) {
    return execute(abi.encode(tradeID));
  }
}
