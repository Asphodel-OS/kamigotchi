// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibTrade } from "libraries/LibTrade.sol";

uint256 constant ID = uint256(keccak256("system.trade.execute"));

contract TradeExecuteSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 tradeID = abi.decode(arguments, (uint256));

    uint256 accID = LibAccount.getByOwner(components, msg.sender);
    LibTrade.verifyRoom(components, accID);
    LibTrade.verifyTarget(components, tradeID, accID);

    // logging (before trade deletes)
    LibTrade.logComplete(components, tradeID, accID);

    // execute and remove trade
    LibTrade.execute(world, components, tradeID, accID);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(uint256 tradeID) public returns (bytes memory) {
    return execute(abi.encode(tradeID));
  }
}
