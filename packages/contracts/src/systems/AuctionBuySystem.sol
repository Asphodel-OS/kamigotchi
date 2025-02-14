// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibAuction } from "libraries/LibAuction.sol";
import { LibInventory } from "libraries/LibInventory.sol";

uint256 constant ID = uint256(keccak256("system.auction.buy"));

// this currently supports at most one global auction specified per item
contract AuctionBuySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint32 itemIndex, uint32 amt) = abi.decode(arguments, (uint32, uint32));
    uint256 accID = LibAccount.verifyOwner(components);
    uint256 id = LibAuction.verifyBuyParams(components, itemIndex, amt);
    LibAuction.verifyRequirements(components, id, accID);

    // process the buy
    uint256 cost = LibAuction.calcBuy(components, id, amt);
    uint32 payItemIndex = LibInventory.getItemIndex(components, id);
    LibInventory.decFor(components, accID, payItemIndex, cost);
    LibInventory.incFor(components, accID, itemIndex, amt);
    LibAuction.incBalance(components, id, amt);

    // enable logging to support historic sales date + price history
    uint32 accIndex = LibAccount.getIndex(components, accID);
    LibAuction.logBuy(world, LibAuction.BuyLog(itemIndex, accIndex, amt, cost));

    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(uint32 itemIndex, uint32 amt) public returns (bytes memory) {
    return execute(abi.encode(itemIndex, amt));
  }
}
