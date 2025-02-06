// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibAuction } from "libraries/LibAuction.sol";
import { LibAuctionRegistry } from "libraries/LibAuctionRegistry.sol";
import { LibInventory } from "libraries/LibInventory.sol";

uint256 constant ID = uint256(keccak256("system.auction.buy"));

// this currently supports at most one global auction specified per item
contract AuctionBuySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint32 itemIndex, uint32 amt) = abi.decode(arguments, (uint32, uint32));
    require(amt > 0, "AuctionBuy: purchase amount must be positive");
    uint256 accID = LibAccount.getByOwner(components, msg.sender);
    require(accID != 0, "AuctionBuy: account not found");

    uint256 id = LibAuctionRegistry.get(components, itemIndex);
    require(id != 0, "AuctionBuy: auction does not exist");
    require(LibAuction.meetsRequirements(components, id, accID), "AuctionBuy: reqs not met");
    require(!LibAuction.exceedsLimit(components, id, amt), "AuctionBuy: exceeds auction limit");

    // process the buy
    // uint256 cost = LibAuction.buy(components, id, accID, amt);

    uint256 cost = LibAuction.calcBuy(components, id, amt);
    uint32 payItemIndex = LibInventory.getItemIndex(components, id);
    LibInventory.decFor(components, accID, payItemIndex, cost);
    LibInventory.incFor(components, accID, itemIndex, amt);
    LibAuction.incBalance(components, id, amt);

    // // enable logging to support historic sales date + price history
    // bytes buyLog = abi.encode(itemIndex, accIndex, amt, cost, block.timestamp);
    // LibAuction.logBuy(world, ID, buyLog);

    return "";
  }

  function executeTyped(uint32 itemIndex, uint32 amt) public returns (bytes memory) {
    return execute(abi.encode(itemIndex, amt));
  }
}
