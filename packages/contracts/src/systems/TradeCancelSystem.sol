// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibTrade } from "libraries/LibTrade.sol";

uint256 constant ID = uint256(keccak256("system.Trade.Cancel"));

// TradeCancelSystem allows an account to cancel a trade they're currently involved in
contract TradeCancelSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 tradeID = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByAddress(components, msg.sender);

    // requirements
    // TODO: add same room check once disabling of room switching enforced on FE
    if (!LibTrade.isTrade(components, tradeID)) revert LibTrade.notTrade();
    if (!LibTrade.hasParticipant(components, tradeID, accountID)) revert LibTrade.notParticipant();
    if (LibTrade.hasState(components, tradeID, "CANCELED")) revert LibTrade.isCanceled();
    if (LibTrade.hasState(components, tradeID, "CONFIRMED")) revert LibTrade.isConfirmed();

    LibTrade.cancel(world, components, tradeID);
    LibAccount.updateLastBlock(components, accountID);
    return "";
  }

  function executeTyped(uint256 tradeID) public returns (bytes memory) {
    return execute(abi.encode(tradeID));
  }
}
