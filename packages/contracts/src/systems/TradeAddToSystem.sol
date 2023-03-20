// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibRegister } from "libraries/LibRegister.sol";
import { LibTrade } from "libraries/LibTrade.sol";

uint256 constant ID = uint256(keccak256("system.Trade.AddTo"));

// TradeAddToSystem allows an account to add to their register in an ACCEPTED trade
contract TradeAddToSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 tradeID, uint256 itemIndex, uint256 amt) = abi.decode(
      arguments,
      (uint256, uint256, uint256)
    );
    uint256 accountID = LibAccount.getByAddress(components, msg.sender);

    // requirements
    // TODO: add same room check once disabling of room switching enforced on FE
    // TODO: add restriction from adding to register when already confirmed
    require(LibTrade.isTrade(components, tradeID), "Trade: not a trade");
    require(LibTrade.hasParticipant(components, tradeID, accountID), "Trade: must be participant");
    require(LibTrade.hasState(components, tradeID, "ACCEPTED"), "Trade: must be accepted");

    uint256 registerID = LibRegister.get(components, accountID, tradeID);
    LibRegister.addTo(world, components, registerID, itemIndex, amt);
    LibAccount.updateLastBlock(components, accountID);
    return "";
  }

  function executeTyped(
    uint256 tradeID,
    uint256 itemIndex,
    uint256 amt
  ) public returns (bytes memory) {
    return execute(abi.encode(tradeID, itemIndex, amt));
  }
}
