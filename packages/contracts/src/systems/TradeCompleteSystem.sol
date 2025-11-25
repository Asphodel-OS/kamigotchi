// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibTrade } from "libraries/LibTrade.sol";
import { AuthRoles } from "libraries/utils/AuthRoles.sol";

uint256 constant ID = uint256(keccak256("system.trade.complete"));

contract TradeCompleteSystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));

    uint256 accID = LibAccount.getByOwner(components, msg.sender);
    LibTrade.verifyIsTrade(components, id);
    LibTrade.verifyState(components, id, "EXECUTED");
    LibTrade.verifyMaker(components, id, accID);

    // complete the Trade
    LibTrade.processDeliveryFee(components, accID);
    LibTrade.complete(world, components, id, accID);

    // data logging and event emission
    LibTrade.emitTradeComplete(world, id, accID);
    LibTrade.logComplete(components, accID);
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  // admin function for completing a Trade
  function executeAdmin(uint256[] memory ids) public onlyAdmin(components) {
    uint256 id;
    uint256 makerID;
    for (uint256 i; i < ids.length; i++) {
      id = ids[i];
      LibTrade.verifyState(components, id, "EXECUTED");

      makerID = LibTrade.getMaker(components, id);
      LibTrade.complete(world, components, id, makerID); // complete the Trade as maker
      LibTrade.emitTradeComplete(world, id, 0); // emit Complete event as admin
    }
  }

  /// @param id Trade ID
  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
