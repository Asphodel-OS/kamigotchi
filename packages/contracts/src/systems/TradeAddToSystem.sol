// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibRegister } from "libraries/LibRegister.sol";
import { LibTrade } from "libraries/LibTrade.sol";

uint256 constant ID = uint256(keccak256("system.trade.add"));

// TradeAddToSystem allows an account to add to their register in an ACCEPTED trade
contract TradeAddToSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 tradeID, uint32 itemIndex, uint256 amt) = abi.decode(
      arguments,
      (uint256, uint32, uint256)
    );
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // requirements
    // TODO: add same room check once disabling of room switching enforced on FE
    // TODO: add restriction from adding to register when already confirmed
    require(LibTrade.isTrade(components, tradeID), "Trade: not a trade");
    require(LibTrade.hasParticipant(components, tradeID, accID), "Trade: must be participant");
    require(LibTrade.hasState(components, tradeID, "ACCEPTED"), "Trade: must be accepted");

    uint256 registerID = LibRegister.get(components, accID, tradeID);
    LibRegister.addTo(components, registerID, itemIndex, amt);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(
    uint256 tradeID,
    uint32 itemIndex,
    uint256 amt
  ) public returns (bytes memory) {
    return execute(abi.encode(tradeID, itemIndex, amt));
  }
}
