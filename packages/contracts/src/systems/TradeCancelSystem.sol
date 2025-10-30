// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { LibTrade } from "libraries/LibTrade.sol";

uint256 constant ID = uint256(keccak256("system.trade.cancel"));

contract TradeCancelSystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));

    uint256 accID = LibAccount.getByOwner(components, msg.sender);
    LibTrade.verifyIsTrade(components, id);
    LibTrade.verifyState(components, id, "PENDING");
    LibTrade.verifyMaker(components, id, accID);

    // cancel the Trade
    LibTrade.processDeliveryFee(components, accID);
    LibTrade.cancel(components, id);

    // data logging and event emission
    LibTrade.emitTradeCancel(world, id, accID);
    LibTrade.logCancel(components, accID);
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  // admin function for canceling a Trade
  function executeAdmin(uint256[] memory ids) public onlyAdmin(components) {
    uint256 id;
    for (uint256 i; i < ids.length; i++) {
      id = ids[i];
      LibTrade.verifyState(components, id, "PENDING");
      LibTrade.cancel(components, id); // cancel the Trade
      LibTrade.emitTradeCancel(world, id, 0); // emit Cancel event as admin
    }
  }

  /// @param id Trade ID
  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
