// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibAuction } from "libraries/LibAuction.sol";
import { LibAuctionRegistry } from "libraries/LibAuctionRegistry.sol";

uint256 constant ID = uint256(keccak256("system.auction"));

// this currently supports at most one global auction specified per item
contract AuctionBuySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint32 itemIndex, int32 amt) = abi.decode(arguments, (uint32, int32));
    require(amt > 0, "AuctionBuy: purchase amount must be positive");
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    uint256 id = LibAuctionRegistry.get(components, itemIndex);
    require(id != 0, "AuctionBuy: auction does not exist");
    require(LibAuction.meetsRequirements(components, id, accID), "AuctionBuy: reqs not met");
    require(!LibAuction.exceedsLimit(components, id, amt), "AuctionBuy: exceeds auction limit");

    // process the buy
    uint256 cost = LibAuction.buy(components, id, accID, amt);
    // bytes buyLog = abi.encode(itemIndex, accIndex, amt, cost, block.timestamp);
    // LibAuction.logBuy(world, ID, buyLog);

    // check whether we should reset the curve (to avoid future overflows)
    if (LibAuction.shouldReset(components, id)) {
      uint256 targetPrice = LibAuction.calcBuy(components, id, 1);
      LibAuctionRegistry.reset(components, id, targetPrice);
      // bytes resetLog = abi.encode(itemIndex, accIndex, targetPrice, block.timestamp);
      // LibAuction.logReset(world, ID, resetLog);
    }
    return "";
  }

  function executeTyped(uint256 to) public returns (bytes memory) {
    require(false, "GachaAuctionSystem: not implemented");
    return execute(abi.encode(to));
  }
}
