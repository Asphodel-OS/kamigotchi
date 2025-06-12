// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibTrade } from "libraries/LibTrade.sol";

uint256 constant ID = uint256(keccak256("system.trade.execute"));

contract TradeExecuteSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));

    uint256 accID = LibAccount.getByOwner(components, msg.sender);
    LibTrade.verifyRoom(components, accID);
    LibTrade.verifyIsTrade(components, id);
    LibTrade.verifyState(components, id, "OPEN");
    LibTrade.verifyTaker(components, id, accID);
    LibTrade.verifyNotMaker(components, id, accID);

    // execute and remove trade
    LibTrade.execute(world, components, id, accID);

    // data logging and event emission
    LibTrade.emitTradeExecute(world, id, accID);
    LibTrade.logExecute(components, accID);
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  /// @param id Trade ID
  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
